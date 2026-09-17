"""Backend tests for new SilentCX features:
  - Questionnaire Builder CRUD
  - Evidence uploads (multipart + static serve + mime/size validation)
  - Submission QC revision -> notify + email_log
  - Project report_published notify + email_log
  - Consultation slots/book/cancel with entitlement + weekend + collision
  - Admin notifications + Google integration status/connect
"""
import io
import os
import uuid
import time
from datetime import datetime, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

DEMO = {
    "admin": ("admin@silentcx.demo", "demo123"),
    "essential": ("essential@silentcx.demo", "demo123"),
    "performance": ("performance@silentcx.demo", "demo123"),
    "shopper": ("shopper@silentcx.demo", "demo123"),
}


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()


def _hdr(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_token():
    return _login(*DEMO["admin"])["token"]


@pytest.fixture(scope="module")
def performance_token():
    return _login(*DEMO["performance"])["token"]


@pytest.fixture(scope="module")
def essential_token():
    return _login(*DEMO["essential"])["token"]


@pytest.fixture(scope="module")
def shopper_token():
    return _login(*DEMO["shopper"])["token"]


# ---------------- Questionnaire builder ----------------
class TestQuestionnaire:
    def test_create_update_duplicate_delete(self, admin_token):
        h = _hdr(admin_token)
        # create
        payload = {"name": "TEST_QN " + uuid.uuid4().hex[:4],
                   "service_type": "Mystery Shopping", "industry": "F&B",
                   "package_keys": ["insight"], "active": True,
                   "questions": [
                       {"question": "Greeting?", "type": "yes_no", "weight": 5},
                       {"question": "Cleanliness rating", "type": "scale_1_5", "weight": 3},
                       {"question": "", "type": "text"},  # should be dropped
                   ]}
        r = requests.post(f"{API}/admin/questionnaires", json=payload, headers=h, timeout=30)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["id"].startswith("qn_")
        assert len(created["questions"]) == 2
        assert created["questions"][0]["order"] == 1
        assert created["questions"][1]["order"] == 2
        qid = created["id"]

        # update - reorder + rename
        upd_questions = [created["questions"][1], created["questions"][0]]
        r = requests.put(f"{API}/admin/questionnaires/{qid}",
                         json={"name": "TEST_QN Renamed", "questions": upd_questions}, headers=h, timeout=30)
        assert r.status_code == 200
        upd = r.json()
        assert upd["name"] == "TEST_QN Renamed"
        assert upd["questions"][0]["question"] == "Cleanliness rating"
        assert upd["questions"][0]["order"] == 1
        assert upd["questions"][1]["order"] == 2

        # duplicate
        r = requests.post(f"{API}/admin/questionnaires/{qid}/duplicate", headers=h, timeout=30)
        assert r.status_code == 200
        dup = r.json()
        assert dup["id"] != qid
        assert dup["name"].endswith("(Copy)")
        assert dup["active"] is False

        # delete both
        r = requests.delete(f"{API}/admin/questionnaires/{dup['id']}", headers=h, timeout=30)
        assert r.status_code == 200
        r = requests.delete(f"{API}/admin/questionnaires/{qid}", headers=h, timeout=30)
        assert r.status_code == 200

    def test_delete_blocks_if_in_use(self, admin_token, shopper_token):
        h = _hdr(admin_token)
        # create QN
        r = requests.post(f"{API}/admin/questionnaires",
                          json={"name": "TEST_QN_InUse", "questions": [{"question": "Q?", "type": "yes_no"}]},
                          headers=h, timeout=30)
        qid = r.json()["id"]

        # create assignment referencing it via admin
        shopper = requests.get(f"{API}/shopper/home", headers=_hdr(shopper_token), timeout=30).json()
        shopper_id = shopper["user"]["id"]
        r = requests.post(f"{API}/admin/assignments",
                          json={"project_id": "PRJ-1003", "shopper_id": shopper_id,
                                "outlet": "TEST outlet", "audit_id": f"AUD-TST{uuid.uuid4().hex[:3]}",
                                "questionnaire_id": qid, "reward": 100000},
                          headers=h, timeout=30)
        assert r.status_code == 200, r.text
        aid = r.json()["assignment"]["id"]

        r = requests.delete(f"{API}/admin/questionnaires/{qid}", headers=h, timeout=30)
        assert r.status_code == 400
        # cleanup: mark assignment completed then delete QN
        # (can't easily set to completed; leave assignment, but remove QN reference via PUT is not needed. Test just verifies 400)


# ---------------- Shopper assignment / evidence ----------------
class TestShopperAssignment:
    def test_assignment_returns_questionnaire(self, shopper_token):
        home = requests.get(f"{API}/shopper/home", headers=_hdr(shopper_token), timeout=30).json()
        assignments = home["assignments"]
        assert assignments
        aid = assignments[0]["id"]
        r = requests.get(f"{API}/shopper/assignments/{aid}", headers=_hdr(shopper_token), timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body["questionnaire"] is not None
        assert body["questionnaire"].get("questions")


class TestEvidenceUpload:
    def _asg(self, token):
        home = requests.get(f"{API}/shopper/home", headers=_hdr(token), timeout=30).json()
        return next(a for a in home["assignments"] if a["status"] in ("pending_submission", "upcoming"))

    def test_upload_success_and_serve(self, shopper_token):
        a = self._asg(shopper_token)
        # 1x1 png bytes
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS"
               b"\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x1e\x8b\x8c\x1c\x00"
               b"\x00\x00\x00IEND\xaeB`\x82")
        files = {"file": ("evidence.png", io.BytesIO(png), "image/png")}
        data = {"question_id": "q9"}
        r = requests.post(f"{API}/shopper/assignments/{a['id']}/evidence",
                          headers=_hdr(shopper_token), files=files, data=data, timeout=30)
        assert r.status_code == 200, r.text
        item = r.json()
        assert item["provider"] == "local"
        assert item["url"].startswith("/api/uploads/")
        assert item["mime"] == "image/png"
        assert item["question_id"] == "q9"
        # fetch via public URL
        serve = requests.get(f"{BASE_URL}{item['url']}", timeout=30)
        assert serve.status_code == 200
        assert serve.content[:4] == b"\x89PNG"

    def test_upload_reject_mime(self, shopper_token):
        a = self._asg(shopper_token)
        files = {"file": ("evil.exe", io.BytesIO(b"MZ"), "application/octet-stream")}
        r = requests.post(f"{API}/shopper/assignments/{a['id']}/evidence",
                          headers=_hdr(shopper_token), files=files, data={"question_id": "q1"}, timeout=30)
        assert r.status_code == 400

    def test_upload_reject_too_large(self, shopper_token):
        a = self._asg(shopper_token)
        big = b"\x00" * (10 * 1024 * 1024 + 10)
        files = {"file": ("big.png", io.BytesIO(big), "image/png")}
        r = requests.post(f"{API}/shopper/assignments/{a['id']}/evidence",
                          headers=_hdr(shopper_token), files=files, data={"question_id": "q1"}, timeout=60)
        assert r.status_code == 400


# ---------------- QC revision notification + email log ----------------
class TestQCFlow:
    def test_revision_notifies_shopper_and_logs_email(self, admin_token, shopper_token):
        # create a submission by shopper first
        h_shop = _hdr(shopper_token)
        home = requests.get(f"{API}/shopper/home", headers=h_shop, timeout=30).json()
        a = next(a for a in home["assignments"] if a["status"] in ("pending_submission", "upcoming"))
        r = requests.post(f"{API}/shopper/assignments/{a['id']}/submit",
                          json={"score": 80, "answers": {}, "evidence": [], "notes": "TEST submission"},
                          headers=h_shop, timeout=30)
        assert r.status_code == 200
        sid = r.json()["submission"]["id"]

        # admin revises
        h = _hdr(admin_token)
        r = requests.post(f"{API}/admin/submissions/{sid}/action",
                          json={"action": "revision", "note": "TEST please add receipt"}, headers=h, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "revision_required"

        # shopper sees notification
        time.sleep(0.5)
        home2 = requests.get(f"{API}/shopper/home", headers=h_shop, timeout=30).json()
        titles = [n["title"] for n in home2.get("notifications", [])]
        assert "Revision Requested" in titles

        # email log via admin google status
        g = requests.get(f"{API}/admin/integrations/google", headers=h, timeout=30).json()
        subjects = [e.get("subject", "") for e in g.get("email_log", [])]
        assert any("Revision Requested" in s for s in subjects), f"no revision email in log: {subjects[:5]}"


# ---------------- Project publish notify ----------------
class TestProjectPublish:
    def test_report_published_notify_and_email(self, admin_token, performance_token):
        h = _hdr(admin_token)
        r = requests.post(f"{API}/admin/projects/PRJ-1003/status",
                          json={"status": "report_published"}, headers=h, timeout=30)
        assert r.status_code == 200
        time.sleep(0.5)
        ov = requests.get(f"{API}/client/overview", headers=_hdr(performance_token), timeout=30).json()
        titles = [n["title"] for n in ov.get("notifications", [])]
        assert "Report Published" in titles
        g = requests.get(f"{API}/admin/integrations/google", headers=h, timeout=30).json()
        subjects = [e.get("subject", "") for e in g.get("email_log", [])]
        assert any("Report Published" in s for s in subjects)


# ---------------- Consultation ----------------
def _next_weekday_iso():
    d = datetime.now()
    while True:
        d = d + timedelta(days=1)
        if d.weekday() < 5:
            return d.strftime("%Y-%m-%d")


def _next_weekend_iso():
    d = datetime.now()
    while True:
        d = d + timedelta(days=1)
        if d.weekday() >= 5:
            return d.strftime("%Y-%m-%d")


class TestConsultation:
    def test_slots_weekday(self, performance_token):
        date = _next_weekday_iso()
        r = requests.get(f"{API}/client/consultation/slots?date={date}",
                         headers=_hdr(performance_token), timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data["slots"]) == 8

    def test_slots_weekend_none_available(self, performance_token):
        date = _next_weekend_iso()
        r = requests.get(f"{API}/client/consultation/slots?date={date}",
                         headers=_hdr(performance_token), timeout=30)
        data = r.json()
        assert all(s["available"] is False for s in data["slots"])

    def test_essential_forbidden_book(self, essential_token):
        date = _next_weekend_iso()  # doesn't matter; entitlement check fires first? No, project check first
        # Use PRJ-1001 (essential) - entitlement check should fail
        r = requests.post(f"{API}/client/consultation/book",
                          json={"project_id": "PRJ-1001", "start": f"{_next_weekday_iso()}T11:00:00+07:00",
                                "topic": "TEST"},
                          headers=_hdr(essential_token), timeout=30)
        assert r.status_code == 403

    def test_book_collision_and_cancel(self, performance_token):
        date = _next_weekday_iso()
        # find an available slot
        r = requests.get(f"{API}/client/consultation/slots?date={date}",
                         headers=_hdr(performance_token), timeout=30)
        slots = r.json()["slots"]
        slot = next((s for s in slots if s["available"]), None)
        assert slot, "no available slot"
        start = slot["start"]

        r = requests.post(f"{API}/client/consultation/book",
                          json={"project_id": "PRJ-1003", "start": start, "topic": "TEST consult"},
                          headers=_hdr(performance_token), timeout=30)
        assert r.status_code == 200, r.text
        c = r.json()["consultation"]
        assert c["status"] == "scheduled"
        assert c["provider"] == "internal"
        cid = c["id"]

        # collision -> 409
        r = requests.post(f"{API}/client/consultation/book",
                          json={"project_id": "PRJ-1003", "start": start, "topic": "TEST 2"},
                          headers=_hdr(performance_token), timeout=30)
        assert r.status_code == 409

        # cancel
        r = requests.post(f"{API}/client/consultation/{cid}/cancel",
                          headers=_hdr(performance_token), timeout=30)
        assert r.status_code == 200
        ov = requests.get(f"{API}/client/overview", headers=_hdr(performance_token), timeout=30).json()
        c2 = next(x for x in ov["consultations"] if x["id"] == cid)
        assert c2["status"] == "cancelled"


# ---------------- Admin notifications + Google integration ----------------
class TestAdminIntegration:
    def test_admin_notifications(self, admin_token):
        r = requests.get(f"{API}/admin/notifications", headers=_hdr(admin_token), timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_google_status(self, admin_token):
        r = requests.get(f"{API}/admin/integrations/google", headers=_hdr(admin_token), timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["configured"] is True
        assert data["connected"] is False
        assert "email_log" in data

    def test_google_connect_url(self, admin_token):
        r = requests.get(f"{API}/admin/integrations/google/connect", headers=_hdr(admin_token), timeout=30)
        assert r.status_code == 200
        url = r.json()["authorization_url"]
        assert "accounts.google.com" in url
