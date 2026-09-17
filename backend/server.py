from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import jwt
import bcrypt
from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from catalog import PACKAGES, ADDONS, SCORE_THRESHOLDS
from entitlements import resolve_entitlements
import seed_data
import google_integration as gi
from notify import notify, notify_admins

UPLOAD_DIR = Path(os.environ["UPLOAD_DIR"])
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_URL = os.environ["FRONTEND_URL"]

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

app = FastAPI(title="SilentCX API")
api = APIRouter(prefix="/api")
logger = logging.getLogger("silentcx")
logging.basicConfig(level=logging.INFO)


# ---------------- Auth helpers ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return clean(user)


def require_role(*roles):
    async def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker


# ---------------- Models ----------------
class RegisterClient(BaseModel):
    name: str
    email: EmailStr
    whatsapp: str
    password: str


class Login(BaseModel):
    email: EmailStr
    password: str


class ShopperApplication(BaseModel):
    name: str
    email: EmailStr
    whatsapp: str
    password: str
    dob: Optional[str] = ""
    city: Optional[str] = ""
    address: Optional[str] = ""
    gender: Optional[str] = ""
    occupation: Optional[str] = ""
    available_cities: Optional[List[str]] = []
    transportation: Optional[str] = ""
    experience: Optional[str] = ""
    preferred_industry: Optional[str] = ""
    bank: Optional[str] = ""


class OnboardingPayload(BaseModel):
    company: dict
    package_key: str
    addons: List[str] = []
    outlets: List[dict] = []
    objectives: List[str] = []
    documents: List[dict] = []


# ---------------- Auth routes ----------------
@api.post("/auth/register")
async def register(body: RegisterClient):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "email": email, "name": body.name, "whatsapp": body.whatsapp,
           "role": "client", "status": "active", "onboarding_complete": False,
           "password_hash": hash_password(body.password), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(doc)
    token = create_token(uid, email, "client")
    return {"token": token, "user": clean(dict(doc))}


@api.post("/auth/login")
async def login(body: Login):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], email, user["role"])
    return {"token": token, "user": clean(dict(user))}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/logout")
async def logout():
    return {"ok": True}


# ---------------- Catalog / CMS (public) ----------------
@api.get("/packages")
async def get_packages():
    docs = await db.packages.find({}).to_list(100)
    return [clean(d) for d in docs] if docs else PACKAGES


@api.get("/addons")
async def get_addons():
    docs = await db.addons.find({}).to_list(100)
    return [clean(d) for d in docs] if docs else ADDONS


@api.get("/score-thresholds")
async def get_thresholds():
    doc = await db.settings.find_one({"id": "score_thresholds"})
    return clean(doc)["value"] if doc else SCORE_THRESHOLDS


@api.get("/cms")
async def get_cms():
    doc = await db.cms.find_one({"id": "cms_main", "status": "published"})
    if not doc:
        doc = await db.cms.find_one({"id": "cms_main"})
    return clean(doc) if doc else seed_data.default_cms()


# ---------------- Onboarding ----------------
@api.post("/onboarding")
async def complete_onboarding(body: OnboardingPayload, user: dict = Depends(require_role("client"))):
    pkg = next((p for p in PACKAGES if p["key"] == body.package_key), None)
    if not pkg:
        raise HTTPException(status_code=400, detail="Invalid package")
    comp_id = f"comp_{uuid.uuid4().hex[:8]}"
    company = {**body.company, "id": comp_id, "client_id": user["id"]}
    await db.companies.insert_one(dict(company))

    outlet_ids = []
    for o in (body.outlets or [{"name": "Main Outlet", "city": body.company.get("city", "")}]):
        oid = f"out_{uuid.uuid4().hex[:8]}"
        outlet_ids.append(oid)
        await db.outlets.insert_one({"id": oid, "client_id": user["id"], "company_id": comp_id,
                                     "name": o.get("name"), "city": o.get("city", ""),
                                     "address": o.get("address", ""), "status": "active",
                                     "latest_cx": None, "latest_sop": None, "last_audit": None})

    addon_snaps = [a for a in ADDONS if a["key"] in body.addons]
    ent = resolve_entitlements(body.package_key, body.addons)
    seq = await db.counters.find_one_and_update({"id": "seq"}, {"$inc": {"n": 1}}, upsert=True, return_document=True)
    n = 1004 + (seq or {}).get("n", 1)
    project_id = f"PRJ-{n}"
    pid = f"prj_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    base_price = pkg["price"]
    if body.package_key == "performance":
        tier = next((t for t in pkg.get("price_tiers", []) if t["outlets"] == max(3, len(outlet_ids))), None)
        base_price = tier["price"] if tier else base_price
    addons_total = sum(a["price"] for a in addon_snaps)
    subtotal = base_price + addons_total
    project = {"id": pid, "project_id": project_id, "client_id": user["id"], "company_id": comp_id,
               "package_key": body.package_key, "package_snapshot": pkg, "addons": body.addons,
               "addon_snapshot": addon_snaps, "entitlements": ent, "outlets": outlet_ids,
               "status": "awaiting_review", "objectives": body.objectives, "documents": body.documents,
               "created_at": now, "purchase_allowance": pkg["purchase_allowance"]}
    await db.projects.insert_one(dict(project))

    invoice = {"id": f"inv_{uuid.uuid4().hex[:8]}", "invoice_id": f"INV-{n}", "project_id": project_id,
               "client_id": user["id"], "client": company.get("name"), "package": pkg["name"],
               "outlet_count": len(outlet_ids), "base_price": base_price,
               "items": [{"label": f"{pkg['name']} ({len(outlet_ids)} outlet)", "amount": base_price}]
               + [{"label": a["name"], "amount": a["price"]} for a in addon_snaps],
               "addons_total": addons_total, "reimbursement": 0, "out_of_city": 0, "discount": 0,
               "subtotal": subtotal, "total": subtotal, "status": "unpaid", "created_at": now}
    await db.invoices.insert_one(dict(invoice))

    await db.users.update_one({"id": user["id"]}, {"$set": {"onboarding_complete": True,
                              "client_id": f"CLT-{n}"}})
    await db.notifications.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"],
        "title": "Project Created", "body": f"Your audit project {project_id} has been submitted for review.",
        "read": False, "created_at": now})
    return {"client_id": f"CLT-{n}", "project_id": project_id, "invoice_id": invoice["invoice_id"]}


# ---------------- Client routes ----------------
def score_rating(s):
    for t in SCORE_THRESHOLDS:
        if s >= t["min"]:
            return t["label"]
    return "Critical"


@api.get("/client/overview")
async def client_overview(user: dict = Depends(require_role("client"))):
    projects = [clean(p) for p in await db.projects.find({"client_id": user["id"]}).to_list(100)]
    outlets = [clean(o) for o in await db.outlets.find({"client_id": user["id"]}).to_list(100)]
    reports = [clean(r) for r in await db.reports.find({"project_id": {"$in": [p["project_id"] for p in projects]}}).to_list(100)]
    invoices = [clean(i) for i in await db.invoices.find({"client_id": user["id"]}).to_list(100)]
    scored = [r["overall_cx_score"] for r in reports if r.get("overall_cx_score")]
    all_findings = [f for r in reports for f in r.get("findings", [])]
    entitlements = sorted({e for p in projects for e in p.get("entitlements", [])})
    active_project = projects[0] if projects else None
    return {
        "active_audits": len([p for p in projects if p["status"] not in ("completed", "report_published")]) or len(projects),
        "completed_audits": len([p for p in projects if p["status"] in ("report_published", "completed")]),
        "avg_cx": round(sum(scored) / len(scored)) if scored else 0,
        "total_outlets": len(outlets),
        "open_findings": len([f for f in all_findings if f.get("status") == "open"]),
        "critical_findings": len([f for f in all_findings if f.get("severity") == "critical"]),
        "current_package": active_project["package_snapshot"]["name"] if active_project else None,
        "entitlements": entitlements,
        "projects": projects, "reports": reports, "invoices": invoices, "outlets": outlets,
        "consultations": [clean(c) for c in await db.consultations.find({"client_id": user["id"]}).to_list(50)],
        "notifications": [clean(n) for n in await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)],
    }


@api.get("/client/projects")
async def client_projects(user: dict = Depends(require_role("client"))):
    return [clean(p) for p in await db.projects.find({"client_id": user["id"]}).to_list(100)]


@api.get("/client/projects/{project_id}")
async def client_project(project_id: str, user: dict = Depends(require_role("client"))):
    p = await db.projects.find_one({"project_id": project_id, "client_id": user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    report = await db.reports.find_one({"project_id": project_id})
    outlets = [clean(o) for o in await db.outlets.find({"id": {"$in": p.get("outlets", [])}}).to_list(50)]
    return {"project": clean(p), "report": clean(report) if report else None, "outlets": outlets}


@api.get("/reports/{project_id}")
async def get_report(project_id: str, user: dict = Depends(get_current_user)):
    p = await db.projects.find_one({"project_id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if user["role"] == "client" and p["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    report = await db.reports.find_one({"project_id": project_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not available")
    return {"report": clean(report), "project": clean(p)}


@api.post("/client/addons/request")
async def request_addon(body: dict, user: dict = Depends(require_role("client"))):
    project_id = body.get("project_id")
    addon_key = body.get("addon_key")
    p = await db.projects.find_one({"project_id": project_id, "client_id": user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    addon = next((a for a in ADDONS if a["key"] == addon_key), None)
    if not addon:
        raise HTTPException(status_code=400, detail="Invalid add-on")
    addons = list(set(p.get("addons", []) + [addon_key]))
    ent = resolve_entitlements(p["package_key"], addons)
    await db.projects.update_one({"id": p["id"]}, {"$set": {"addons": addons, "entitlements": ent},
                                 "$addToSet": {"addon_snapshot": addon}})
    inv = await db.invoices.find_one({"project_id": project_id})
    if inv:
        items = inv.get("items", []) + [{"label": addon["name"], "amount": addon["price"]}]
        total = inv["total"] + addon["price"]
        await db.invoices.update_one({"id": inv["id"]}, {"$set": {"items": items, "total": total,
                                     "subtotal": inv["subtotal"] + addon["price"], "status": "unpaid"}})
    await db.notifications.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"],
        "title": "Add-on Requested", "body": f"{addon['name']} added to {project_id}.",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"ok": True, "addons": addons, "entitlements": ent}


@api.post("/client/consultation/request")
async def request_consultation(body: dict, user: dict = Depends(require_role("client"))):
    c = {"id": str(uuid.uuid4()), "project_id": body.get("project_id"), "client_id": user["id"],
         "status": "requested", "topic": body.get("topic", "Consultation request"),
         "scheduled_at": None, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.consultations.insert_one(dict(c))
    return {"ok": True, "consultation": clean(c)}


SLOT_HOURS = list(range(9, 17))  # 09:00–16:00 WIB, 60-minute sessions


@api.get("/client/consultation/slots")
async def consultation_slots(date: str, user: dict = Depends(require_role("client"))):
    try:
        day = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=gi.JAKARTA)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date (YYYY-MM-DD)")
    day_start, day_end = day.replace(hour=SLOT_HOURS[0]), day.replace(hour=SLOT_HOURS[-1] + 1)
    busy = await gi.calendar_busy(db, day_start, day_end)
    booked = await db.consultations.find({"status": "scheduled", "scheduled_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}}).to_list(100)
    taken = [(datetime.fromisoformat(b["scheduled_at"]), datetime.fromisoformat(b["scheduled_at"]) + timedelta(hours=1)) for b in booked]
    taken += busy or []
    now = datetime.now(timezone.utc)
    slots = []
    for h in SLOT_HOURS:
        s, e = day.replace(hour=h), day.replace(hour=h + 1)
        overlap = any(s < te and e > ts for ts, te in taken)
        slots.append({"start": s.isoformat(), "label": f"{h:02d}:00 – {h + 1:02d}:00 WIB",
                      "available": not overlap and s > now and day.weekday() < 5})
    return {"date": date, "slots": slots, "google_calendar": busy is not None}


@api.post("/client/consultation/book")
async def book_consultation(body: dict, user: dict = Depends(require_role("client"))):
    p = await db.projects.find_one({"project_id": body.get("project_id"), "client_id": user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if "consultation" not in p.get("entitlements", []):
        raise HTTPException(status_code=403, detail="Consultation is not included in this package")
    try:
        start = datetime.fromisoformat(body["start"]).astimezone(gi.JAKARTA)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid start time")
    if start.hour not in SLOT_HOURS or start.minute or start <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Slot not available")
    end = start + timedelta(hours=1)
    clash = await db.consultations.find_one({"status": "scheduled", "scheduled_at": start.isoformat()})
    if clash:
        raise HTTPException(status_code=409, detail="Slot already booked")
    busy = await gi.calendar_busy(db, start, end)
    if busy and any(start < te and end > ts for ts, te in busy):
        raise HTTPException(status_code=409, detail="Slot is busy on the consultant calendar")
    topic = body.get("topic") or "CX Strategy Consultation"
    company = await db.companies.find_one({"id": p.get("company_id")})
    event = None
    try:
        event = await gi.calendar_create_event(db, f"SilentCX Consultation — {(company or {}).get('name', user['name'])}",
            f"Topic: {topic}\nProject: {p['project_id']}\nClient: {user['name']} ({user['email']})",
            start, end, [user["email"]])
    except Exception as e:
        logger.error(f"Calendar event failed: {e}")
    now = datetime.now(timezone.utc).isoformat()
    c = {"id": str(uuid.uuid4()), "project_id": p["project_id"], "client_id": user["id"], "client_name": user["name"],
         "status": "scheduled", "topic": topic, "notes": body.get("notes", ""), "scheduled_at": start.isoformat(),
         "ends_at": end.isoformat(), "created_at": now, "provider": "google_calendar" if event else "internal",
         "event_id": (event or {}).get("event_id"), "event_link": (event or {}).get("html_link"),
         "meet_link": (event or {}).get("meet_link")}
    await db.consultations.insert_one(dict(c))
    label = start.strftime("%d %b %Y %H:%M WIB")
    await notify(db, user["id"], "Consultation Scheduled", f"Your session '{topic}' is booked for {label}.", "consultation", "/app/consultation")
    await notify_admins(db, "New Consultation Booking", f"{user['name']} booked '{topic}' on {label} ({p['project_id']}).", "consultation", "/admin/consultations")
    return {"ok": True, "consultation": clean(c)}


@api.post("/client/consultation/{cid}/cancel")
async def cancel_consultation(cid: str, user: dict = Depends(require_role("client"))):
    c = await db.consultations.find_one({"id": cid, "client_id": user["id"]})
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    await gi.calendar_delete_event(db, c.get("event_id"))
    await db.consultations.update_one({"id": cid}, {"$set": {"status": "cancelled"}})
    await notify_admins(db, "Consultation Cancelled", f"{user['name']} cancelled '{c['topic']}'.", "consultation", "/admin/consultations")
    return {"ok": True}


@api.get("/outlets/{outlet_id}")
async def outlet_detail(outlet_id: str, user: dict = Depends(get_current_user)):
    o = await db.outlets.find_one({"id": outlet_id})
    if not o:
        raise HTTPException(status_code=404, detail="Outlet not found")
    reports = [clean(r) for r in await db.reports.find({"outlet_id": outlet_id}).to_list(50)]
    return {"outlet": clean(o), "reports": reports}


@api.post("/invoices/{invoice_id}/pay")
async def pay_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"invoice_id": invoice_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if user["role"] == "client" and inv.get("client_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user["role"] == "shopper":
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.invoices.update_one({"id": inv["id"]}, {"$set": {"status": "paid"}})
    return {"ok": True}


@api.post("/notifications/{nid}/read")
async def read_notification(nid: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------- Shopper routes ----------------
@api.post("/shopper/register")
async def shopper_register(body: ShopperApplication):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "email": email, "name": body.name, "whatsapp": body.whatsapp,
           "role": "shopper", "status": "pending", "password_hash": hash_password(body.password),
           "dob": body.dob, "city": body.city, "address": body.address, "gender": body.gender,
           "occupation": body.occupation, "available_cities": body.available_cities,
           "transportation": body.transportation, "experience": body.experience,
           "preferred_industry": body.preferred_industry, "bank": body.bank,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(doc)
    await db.applications.insert_one({"id": str(uuid.uuid4()), "user_id": uid, "name": body.name,
        "email": email, "whatsapp": body.whatsapp, "city": body.city, "gender": body.gender,
        "occupation": body.occupation, "experience": body.experience,
        "preferred_industry": body.preferred_industry, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()})
    token = create_token(uid, email, "shopper")
    return {"token": token, "user": clean(dict(doc))}


@api.get("/shopper/home")
async def shopper_home(user: dict = Depends(require_role("shopper"))):
    assignments = [clean(a) for a in await db.assignments.find({"shopper_id": user["id"]}).to_list(100)]
    submissions = [clean(s) for s in await db.submissions.find({"shopper_id": user["id"]}).to_list(100)]
    paid = sum(a.get("reward", 0) for a in assignments if a["status"] == "completed")
    pending = sum(a.get("reward", 0) for a in assignments if a["status"] in ("pending_submission", "revision_required"))
    return {"user": user, "assignments": assignments, "submissions": submissions,
            "payments": {"paid": paid, "pending": pending},
            "notifications": [clean(n) for n in await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)]}


@api.get("/shopper/assignments/{aid}")
async def shopper_assignment(aid: str, user: dict = Depends(require_role("shopper"))):
    a = await db.assignments.find_one({"id": aid, "shopper_id": user["id"]})
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    q = await resolve_questionnaire(a)
    return {"assignment": clean(a), "questionnaire": clean(q) if q else None}


async def resolve_questionnaire(assignment: dict):
    if assignment.get("questionnaire_id"):
        q = await db.questionnaires.find_one({"id": assignment["questionnaire_id"]})
        if q:
            return q
    p = await db.projects.find_one({"project_id": assignment.get("project_id")})
    if p:
        q = await db.questionnaires.find_one({"active": True, "package_keys": p.get("package_key"), "questions.0": {"$exists": True}})
        if q:
            return q
        company = await db.companies.find_one({"id": p.get("company_id")})
        ind = (company or {}).get("industry", "")
        if ind:
            async for cand in db.questionnaires.find({"active": True, "questions.0": {"$exists": True}}):
                if cand.get("industry") and cand["industry"].lower() in ind.lower():
                    return cand
    return await db.questionnaires.find_one({"id": "qn_fnb"})


ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"}


@api.post("/shopper/assignments/{aid}/evidence")
async def upload_evidence(aid: str, file: UploadFile = File(...), question_id: str = Form(""),
                          user: dict = Depends(require_role("shopper"))):
    a = await db.assignments.find_one({"id": aid, "shopper_id": user["id"]})
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, HEIC or PDF files are allowed")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    ext = Path(file.filename or "file").suffix or ".jpg"
    stored_name = f"{a['audit_id']}_{question_id or 'general'}_{uuid.uuid4().hex[:8]}{ext}"
    item = None
    try:
        item = await gi.drive_upload(db, content, stored_name, file.content_type, a["audit_id"])
    except Exception as e:
        logger.error(f"Drive upload failed, falling back to local: {e}")
    if not item:
        (UPLOAD_DIR / stored_name).write_bytes(content)
        item = {"provider": "local", "url": f"/api/uploads/{stored_name}", "view_url": f"/api/uploads/{stored_name}"}
    item.update({"id": str(uuid.uuid4()), "name": file.filename, "mime": file.content_type, "size": len(content),
                 "question_id": question_id, "uploaded_at": datetime.now(timezone.utc).isoformat()})
    return item


@api.post("/shopper/assignments/{aid}/submit")
async def shopper_submit(aid: str, body: dict, user: dict = Depends(require_role("shopper"))):
    a = await db.assignments.find_one({"id": aid, "shopper_id": user["id"]})
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    now = datetime.now(timezone.utc).isoformat()
    sub = {"id": str(uuid.uuid4()), "assignment_id": aid, "audit_id": a["audit_id"],
           "shopper_id": user["id"], "outlet": a["outlet"], "status": "under_review",
           "score": body.get("score"), "answers": body.get("answers", {}),
           "transaction_amount": body.get("transaction_amount"), "notes": body.get("notes", ""),
           "evidence": body.get("evidence", []), "submitted_at": now, "locked": True}
    sub["evidence"] = [e for e in sub["evidence"] if isinstance(e, dict)]
    await db.submissions.insert_one(dict(sub))
    await db.assignments.update_one({"id": aid}, {"$set": {"status": "submitted"}})
    await notify_admins(db, "New Submission for QC", f"{user['name']} submitted {a['audit_id']} ({a['outlet']}).", "qc", "/admin/qc")
    return {"ok": True, "submission": clean(sub)}


# ---------------- Admin: notifications & Google integration ----------------
@api.get("/admin/notifications")
async def admin_notifications(user: dict = Depends(require_role("admin"))):
    return [clean(n) for n in await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)]


@api.get("/admin/integrations/google")
async def google_status(user: dict = Depends(require_role("admin"))):
    doc = await db.google_credentials.find_one({"id": gi.CRED_ID})
    emails = await db.email_log.find({}).sort("created_at", -1).to_list(30)
    return {"configured": gi.configured(), "connected": bool(doc),
            "account": (doc or {}).get("email"), "connected_at": (doc or {}).get("connected_at"),
            "scopes": (doc or {}).get("scopes", []), "redirect_uri": gi.cfg()["redirect_uri"],
            "email_provider": "resend" if os.environ.get("RESEND_API_KEY") else "mock",
            "email_log": [clean(e) for e in emails]}


@api.get("/admin/integrations/google/connect")
async def google_connect(user: dict = Depends(require_role("admin"))):
    if not gi.configured():
        raise HTTPException(status_code=400, detail="Google credentials not configured on server")
    state = jwt.encode({"sub": user["id"], "type": "google_oauth",
                        "exp": datetime.now(timezone.utc) + timedelta(minutes=10)}, JWT_SECRET, algorithm=JWT_ALG)
    return {"authorization_url": gi.auth_url(state)}


@api.get("/oauth/google/callback")
async def google_callback(code: str = "", state: str = "", error: str = ""):
    dest = f"{FRONTEND_URL}/admin/integrations"
    if error or not code:
        return RedirectResponse(f"{dest}?google=error&reason={error or 'no_code'}")
    try:
        payload = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "google_oauth":
            raise ValueError("bad state")
        admin = await db.users.find_one({"id": payload["sub"], "role": "admin"})
        if not admin:
            raise ValueError("not admin")
        creds = await asyncio.to_thread(gi.exchange_code, code)
        creds["connected_by"] = admin["id"]
        await db.google_credentials.update_one({"id": gi.CRED_ID}, {"$set": creds}, upsert=True)
        await notify(db, admin["id"], "Google Connected", f"Drive & Calendar linked to {creds.get('email')}.", "integration", "/admin/integrations", email=False)
        return RedirectResponse(f"{dest}?google=connected")
    except Exception as e:
        logger.error(f"Google OAuth failed: {e}")
        return RedirectResponse(f"{dest}?google=error&reason={str(e)[:120]}")


@api.delete("/admin/integrations/google")
async def google_disconnect(user: dict = Depends(require_role("admin"))):
    doc = await db.google_credentials.find_one({"id": gi.CRED_ID})
    if doc:
        try:
            await asyncio.to_thread(lambda: gi.rq.post("https://oauth2.googleapis.com/revoke", params={"token": doc["access_token"]}, timeout=10))
        except Exception:
            pass
        await db.google_credentials.delete_one({"id": gi.CRED_ID})
    return {"ok": True}


# ---------------- Admin: questionnaire builder ----------------
QUESTION_TYPES = {"yes_no", "scale_1_5", "scale_0_10", "text", "numeric", "evidence"}


def normalize_questions(questions: list) -> list:
    out = []
    for i, q in enumerate(questions or []):
        if not (q.get("question") or "").strip():
            continue
        qtype = q.get("type") if q.get("type") in QUESTION_TYPES else "yes_no"
        out.append({"id": q.get("id") or f"q_{uuid.uuid4().hex[:6]}", "question": q["question"].strip(),
                    "category": (q.get("category") or "General").strip(), "type": qtype,
                    "weight": int(q.get("weight") or 0) if qtype in ("yes_no", "scale_1_5", "scale_0_10") else 0,
                    "required": bool(q.get("required", True)), "evidence_required": bool(q.get("evidence_required", False)),
                    "severity": q.get("severity") if q.get("severity") in ("low", "medium", "high", "critical") else "medium",
                    "order": i + 1})
    return out


@api.post("/admin/questionnaires")
async def create_questionnaire(body: dict, user: dict = Depends(require_role("admin"))):
    doc = {"id": f"qn_{uuid.uuid4().hex[:6]}", "name": (body.get("name") or "Untitled Questionnaire").strip(),
           "service_type": body.get("service_type", "Mystery Shopping"), "industry": body.get("industry", ""),
           "package_keys": body.get("package_keys", []), "active": bool(body.get("active", True)),
           "questions": normalize_questions(body.get("questions", [])),
           "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.questionnaires.insert_one(dict(doc))
    return clean(doc)


@api.put("/admin/questionnaires/{qid}")
async def update_questionnaire(qid: str, body: dict, user: dict = Depends(require_role("admin"))):
    existing = await db.questionnaires.find_one({"id": qid})
    if not existing:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    upd = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for k in ("name", "service_type", "industry", "package_keys", "active"):
        if k in body:
            upd[k] = body[k]
    if "questions" in body:
        upd["questions"] = normalize_questions(body["questions"])
    await db.questionnaires.update_one({"id": qid}, {"$set": upd})
    return clean(await db.questionnaires.find_one({"id": qid}))


@api.post("/admin/questionnaires/{qid}/duplicate")
async def duplicate_questionnaire(qid: str, user: dict = Depends(require_role("admin"))):
    src = await db.questionnaires.find_one({"id": qid})
    if not src:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    src = clean(src)
    src.update({"id": f"qn_{uuid.uuid4().hex[:6]}", "name": f"{src['name']} (Copy)", "active": False,
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.questionnaires.insert_one(dict(src))
    return src


@api.delete("/admin/questionnaires/{qid}")
async def delete_questionnaire(qid: str, user: dict = Depends(require_role("admin"))):
    in_use = await db.assignments.count_documents({"questionnaire_id": qid, "status": {"$nin": ["completed", "cancelled"]}})
    if in_use:
        raise HTTPException(status_code=400, detail=f"Questionnaire is used by {in_use} active assignment(s)")
    await db.questionnaires.delete_one({"id": qid})
    return {"ok": True}


# ---------------- Admin routes ----------------
@api.get("/admin/dashboard")
async def admin_dashboard(user: dict = Depends(require_role("admin"))):
    clients = await db.users.count_documents({"role": "client"})
    active_shoppers = await db.users.count_documents({"role": "shopper", "status": "verified"})
    projects = [clean(p) for p in await db.projects.find({}).to_list(500)]
    invoices = [clean(i) for i in await db.invoices.find({}).to_list(500)]
    pending_apps = await db.applications.count_documents({"status": {"$in": ["pending", "under_review"]}})
    pending_qc = await db.submissions.count_documents({"status": "under_review"})
    revenue = sum(i["total"] for i in invoices if i["status"] in ("paid", "partial"))
    unpaid = sum(i["total"] for i in invoices if i["status"] == "unpaid")
    return {
        "total_clients": clients, "active_audits": len([p for p in projects if p["status"] not in ("completed",)]),
        "completed_audits": len([p for p in projects if p["status"] in ("report_published", "completed")]),
        "pending_verification": pending_apps, "pending_qc": pending_qc,
        "reports_waiting": len([p for p in projects if p["status"] == "report_preparation"]),
        "active_shoppers": active_shoppers, "revenue": revenue, "unpaid_invoices": unpaid,
        "action_items": [
            {"label": f"{pending_apps} shopper applications waiting", "link": "/admin/applications"},
            {"label": f"{len([p for p in projects if p['status'] == 'awaiting_review'])} audits waiting assignment", "link": "/admin/projects"},
            {"label": f"{pending_qc} submissions waiting QC", "link": "/admin/qc"},
            {"label": f"{len([p for p in projects if p['status'] == 'report_preparation'])} reports waiting publication", "link": "/admin/reports"},
        ],
        "recent_projects": projects[:8],
    }


@api.get("/admin/{collection}")
async def admin_list(collection: str, user: dict = Depends(require_role("admin"))):
    mapping = {"clients": ("users", {"role": "client"}), "shoppers": ("users", {"role": "shopper"}),
               "applications": ("applications", {}), "projects": ("projects", {}),
               "assignments": ("assignments", {}), "submissions": ("submissions", {}),
               "invoices": ("invoices", {}), "outlets": ("outlets", {}), "companies": ("companies", {}),
               "reports": ("reports", {}), "consultations": ("consultations", {}),
               "questionnaires": ("questionnaires", {}), "categories": ("categories", {}),
               "templates": ("templates", {}), "packages": ("packages", {}), "addons": ("addons", {})}
    if collection not in mapping:
        raise HTTPException(status_code=404, detail="Unknown collection")
    coll, query = mapping[collection]
    return [clean(d) for d in await db[coll].find(query).to_list(1000)]


@api.get("/admin/projects/{project_id}/detail")
async def admin_project_detail(project_id: str, user: dict = Depends(require_role("admin"))):
    p = await db.projects.find_one({"project_id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    report = await db.reports.find_one({"project_id": project_id})
    outlets = [clean(o) for o in await db.outlets.find({"id": {"$in": p.get("outlets", [])}}).to_list(50)]
    company = await db.companies.find_one({"id": p.get("company_id")})
    client_user = await db.users.find_one({"id": p.get("client_id")})
    assignments = [clean(a) for a in await db.assignments.find({"project_id": project_id}).to_list(100)]
    audit_ids = [a.get("audit_id") for a in assignments]
    submissions = [clean(s) for s in await db.submissions.find({"audit_id": {"$in": audit_ids}}).to_list(100)]
    invoice = await db.invoices.find_one({"project_id": project_id})
    return {"project": clean(p), "report": clean(report) if report else None,
            "outlets": outlets, "company": clean(company) if company else None,
            "client": clean(client_user) if client_user else None,
            "assignments": assignments, "submissions": submissions,
            "invoice": clean(invoice) if invoice else None}


@api.get("/admin/submissions/{sid}/detail")
async def admin_submission_detail(sid: str, user: dict = Depends(require_role("admin"))):
    s = await db.submissions.find_one({"id": sid})
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    a = await db.assignments.find_one({"id": s.get("assignment_id")})
    q = await resolve_questionnaire(a) if a else await db.questionnaires.find_one({"id": "qn_fnb"})
    shopper = await db.users.find_one({"id": s.get("shopper_id")})
    answers = s.get("answers", {}) or {}
    evidence = [e for e in s.get("evidence", []) if isinstance(e, dict)]
    questions = []
    for item in (q.get("questions", []) if q else []):
        qid = item.get("id")
        ans = answers.get(qid)
        if item.get("type") == "numeric" and ans in (None, ""):
            ans = s.get("transaction_amount")
        questions.append({**item, "answer": ans,
                          "evidence": [e for e in evidence if (e.get("question_id") or "") == qid]})
    return {"submission": clean(s), "assignment": clean(a) if a else None,
            "questionnaire_name": (q or {}).get("name"),
            "shopper": {"name": shopper.get("name"), "email": shopper.get("email"),
                        "city": shopper.get("city"), "rating": shopper.get("rating")} if shopper else None,
            "questions": questions,
            "unmatched_evidence": [e for e in evidence if not e.get("question_id")]}


@api.post("/admin/applications/{app_id}/action")
async def app_action(app_id: str, body: dict, user: dict = Depends(require_role("admin"))):
    action = body.get("action")
    status_map = {"approve": "verified", "reject": "rejected", "review": "under_review",
                  "revision": "revision_required", "suspend": "suspended"}
    new_status = status_map.get(action)
    if not new_status:
        raise HTTPException(status_code=400, detail="Invalid action")
    app_doc = await db.applications.find_one({"id": app_id})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.applications.update_one({"id": app_id}, {"$set": {"status": new_status}})
    if app_doc.get("user_id"):
        await db.users.update_one({"id": app_doc["user_id"]}, {"$set": {"status": new_status}})
        msgs = {"verified": ("Application Approved", "Welcome aboard! You are now a verified SilentCX mystery shopper."),
                "rejected": ("Application Rejected", "Unfortunately your application was not approved at this time."),
                "revision_required": ("Application Needs Revision", body.get("note") or "Please update your profile and resubmit."),
                "under_review": ("Application Under Review", "Our team is reviewing your application."),
                "suspended": ("Account Suspended", "Your shopper account has been suspended. Contact support.")}
        t, b = msgs[new_status]
        await notify(db, app_doc["user_id"], t, b, "application", "/shopper/profile")
    return {"ok": True, "status": new_status}


@api.post("/admin/projects/{project_id}/status")
async def project_status(project_id: str, body: dict, user: dict = Depends(require_role("admin"))):
    p = await db.projects.find_one({"project_id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one({"id": p["id"]}, {"$set": {"status": body.get("status")}})
    if body.get("status") == "report_published":
        r = await db.reports.find_one({"project_id": project_id})
        if r:
            await db.reports.update_one({"id": r["id"]}, {"$set": {"status": "published"}})
        await notify(db, p["client_id"], "Report Published",
                     f"Your audit report for {project_id} is now available. Open it to view findings and download the PDF.",
                     "report", f"/app/reports/{project_id}")
    elif body.get("status"):
        await notify(db, p["client_id"], "Audit Status Updated",
                     f"{project_id} is now: {body['status'].replace('_', ' ')}.", "status", f"/app/audits/{project_id}", email=False)
    return {"ok": True, "status": body.get("status")}


@api.post("/admin/submissions/{sid}/action")
async def submission_action(sid: str, body: dict, user: dict = Depends(require_role("admin"))):
    action = body.get("action")
    s = await db.submissions.find_one({"id": sid})
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    new_status = {"approve": "approved", "revision": "revision_required", "reject": "rejected"}.get(action)
    if not new_status:
        raise HTTPException(status_code=400, detail="Invalid action")
    await db.submissions.update_one({"id": sid}, {"$set": {"status": new_status, "qc_note": body.get("note", "")}})
    if action == "revision":
        note = body.get("note") or "Please revise and resubmit."
        await db.assignments.update_one({"id": s["assignment_id"]}, {"$set": {"status": "revision_required", "revision_note": note}})
        await notify(db, s["shopper_id"], "Revision Requested", f"{s['audit_id']} ({s['outlet']}): {note}", "revision", f"/shopper/assignments/{s['assignment_id']}")
    elif action == "approve":
        await db.assignments.update_one({"id": s["assignment_id"]}, {"$set": {"status": "completed"}})
        await notify(db, s["shopper_id"], "Submission Approved", f"{s['audit_id']} passed QC. Your reward is being processed.", "qc", "/shopper/payments")
    elif action == "reject":
        await notify(db, s["shopper_id"], "Submission Rejected", f"{s['audit_id']} was rejected. {body.get('note', '')}".strip(), "qc", "/shopper/submissions")
    return {"ok": True, "status": new_status}


@api.post("/admin/assignments")
async def create_assignment(body: dict, user: dict = Depends(require_role("admin"))):
    doc = {"id": str(uuid.uuid4()), "audit_id": body.get("audit_id", f"AUD-{uuid.uuid4().hex[:4]}"),
           "project_id": body.get("project_id"), "shopper_id": body.get("shopper_id"),
           "outlet": body.get("outlet"), "address": body.get("address", ""),
           "maps_link": body.get("maps_link", ""), "visit_window": body.get("visit_window", "TBD"),
           "scenario": body.get("scenario", ""), "required_purchase": body.get("required_purchase", ""),
           "max_reimbursement": 150000, "instructions": body.get("instructions", ""),
           "status": "upcoming", "reward": body.get("reward", 250000), "questionnaire_id": body.get("questionnaire_id")}
    await db.assignments.insert_one(dict(doc))
    await db.projects.update_one({"project_id": body.get("project_id")}, {"$set": {"status": "shopper_assigned"}})
    if doc["shopper_id"]:
        await notify(db, doc["shopper_id"], "New Assignment", f"{doc['audit_id']} at {doc['outlet']} — visit window {doc['visit_window']}.", "assignment", f"/shopper/assignments/{doc['id']}")
    return {"ok": True, "assignment": clean(doc)}


@api.patch("/admin/cms")
async def update_cms(body: dict, user: dict = Depends(require_role("admin"))):
    body["id"] = "cms_main"
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.cms.update_one({"id": "cms_main"}, {"$set": body}, upsert=True)
    doc = await db.cms.find_one({"id": "cms_main"})
    return clean(doc)


@api.patch("/admin/packages/{pkg_id}")
async def update_package(pkg_id: str, body: dict, user: dict = Depends(require_role("admin"))):
    await db.packages.update_one({"id": pkg_id}, {"$set": body}, upsert=True)
    doc = await db.packages.find_one({"id": pkg_id})
    return clean(doc)


@api.post("/admin/addons")
async def create_addon(body: dict, user: dict = Depends(require_role("admin"))):
    body["id"] = body.get("id") or f"addon_{uuid.uuid4().hex[:6]}"
    await db.addons.update_one({"id": body["id"]}, {"$set": body}, upsert=True)
    doc = await db.addons.find_one({"id": body["id"]})
    return clean(doc)


@api.patch("/admin/addons/{addon_id}")
async def update_addon(addon_id: str, body: dict, user: dict = Depends(require_role("admin"))):
    await db.addons.update_one({"id": addon_id}, {"$set": body}, upsert=True)
    doc = await db.addons.find_one({"id": addon_id})
    return clean(doc)


# ---------------- Seeding ----------------
async def seed():
    await db.users.create_index("email", unique=True)
    # Demo/admin users (idempotent, keep password in sync)
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": admin_email, "name": "SilentCX Admin",
            "role": "admin", "status": "active", "password_hash": hash_password(admin_pw),
            "created_at": datetime.now(timezone.utc).isoformat()})
    else:
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})
    owner_email = os.environ.get("OWNER_EMAIL", "").lower()
    if owner_email and not await db.users.find_one({"email": owner_email}):
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": owner_email, "name": "Owner",
            "role": "admin", "status": "active", "password_hash": hash_password("demo123"),
            "created_at": datetime.now(timezone.utc).isoformat()})

    if await db.projects.count_documents({}) > 0:
        return  # already seeded

    data = seed_data.build()
    for u in data["users"]:
        u["password_hash"] = hash_password("demo123")
        await db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)
    if data["companies"]:
        await db.companies.insert_many(data["companies"])
    if data["outlets"]:
        await db.outlets.insert_many(data["outlets"])
    if data["projects"]:
        await db.projects.insert_many(data["projects"])
    if data["reports"]:
        await db.reports.insert_many(data["reports"])
    if data["invoices"]:
        await db.invoices.insert_many(data["invoices"])
    if data["applications"]:
        await db.applications.insert_many(data["applications"])
    if data["assignments"]:
        await db.assignments.insert_many(data["assignments"])
    if data["submissions"]:
        await db.submissions.insert_many(data["submissions"])
    if data["notifications"]:
        await db.notifications.insert_many(data["notifications"])
    if data["consultations"]:
        await db.consultations.insert_many(data["consultations"])
    await db.questionnaires.insert_many([dict(q) for q in seed_data.QUESTIONNAIRES])
    await db.templates.insert_many([dict(t) for t in seed_data.TEMPLATES])
    await db.categories.insert_many([dict(c) for c in seed_data.CATEGORIES])
    await db.packages.insert_many([dict(p) for p in PACKAGES])
    await db.addons.insert_many([dict(a) for a in ADDONS])
    await db.cms.update_one({"id": "cms_main"}, {"$set": seed_data.default_cms()}, upsert=True)
    logger.info("SilentCX demo data seeded.")


@app.on_event("startup")
async def on_startup():
    try:
        await seed()
    except Exception as e:
        logger.error(f"Seed error: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)
