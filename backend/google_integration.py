import os
import io
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

import requests as rq
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

logger = logging.getLogger("silentcx.google")

SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/calendar"]
TOKEN_URI = "https://oauth2.googleapis.com/token"
CRED_ID = "google_workspace"
JAKARTA = ZoneInfo("Asia/Jakarta")


def cfg():
    return {"client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
            "redirect_uri": os.environ.get("GOOGLE_REDIRECT_URI", "")}


def configured() -> bool:
    c = cfg()
    return bool(c["client_id"] and c["client_secret"] and c["redirect_uri"])


def auth_url(state: str) -> str:
    c = cfg()
    params = {"client_id": c["client_id"], "redirect_uri": c["redirect_uri"], "response_type": "code",
              "scope": " ".join(SCOPES), "access_type": "offline", "prompt": "consent",
              "include_granted_scopes": "true", "state": state}
    return "https://accounts.google.com/o/oauth2/v2/auth?" + rq.compat.urlencode(params)


def exchange_code(code: str) -> dict:
    c = cfg()
    resp = rq.post(TOKEN_URI, data={"code": code, "client_id": c["client_id"], "client_secret": c["client_secret"],
                                    "redirect_uri": c["redirect_uri"], "grant_type": "authorization_code"}, timeout=20)
    data = resp.json()
    if "access_token" not in data:
        raise ValueError(data.get("error_description") or data.get("error") or "Token exchange failed")
    granted = set((data.get("scope") or "").split())
    missing = set(SCOPES) - granted
    if missing:
        raise ValueError(f"Missing Google scopes: {', '.join(missing)}")
    info = rq.get("https://www.googleapis.com/oauth2/v2/userinfo",
                  headers={"Authorization": f"Bearer {data['access_token']}"}, timeout=20).json()
    expiry = datetime.now(timezone.utc) + timedelta(seconds=int(data.get("expires_in", 3600)))
    return {"id": CRED_ID, "access_token": data["access_token"], "refresh_token": data.get("refresh_token"),
            "scopes": sorted(granted), "email": info.get("email"), "expiry": expiry.isoformat(),
            "connected_at": datetime.now(timezone.utc).isoformat()}


async def get_credentials(db):
    doc = await db.google_credentials.find_one({"id": CRED_ID})
    if not doc:
        return None
    c = cfg()
    creds = Credentials(token=doc["access_token"], refresh_token=doc.get("refresh_token"), token_uri=TOKEN_URI,
                        client_id=c["client_id"], client_secret=c["client_secret"], scopes=doc.get("scopes"))
    expiry = datetime.fromisoformat(doc["expiry"]) if doc.get("expiry") else None
    if expiry and expiry - timedelta(minutes=2) < datetime.now(timezone.utc) and creds.refresh_token:
        await asyncio.to_thread(creds.refresh, GoogleRequest())
        new_exp = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry else None
        await db.google_credentials.update_one({"id": CRED_ID}, {"$set": {
            "access_token": creds.token, "expiry": new_exp.isoformat() if new_exp else None}})
    return creds


# ---------------- Drive ----------------
def _ensure_folder(service, name: str) -> str:
    q = f"name = '{name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    res = service.files().list(q=q, fields="files(id)", spaces="drive").execute()
    if res.get("files"):
        return res["files"][0]["id"]
    folder = service.files().create(body={"name": name, "mimeType": "application/vnd.google-apps.folder"}, fields="id").execute()
    return folder["id"]


def _drive_upload_sync(creds, content: bytes, filename: str, mime: str, subfolder: str) -> dict:
    service = build("drive", "v3", credentials=creds, cache_discovery=False)
    root = _ensure_folder(service, "SilentCX Evidence")
    q = f"name = '{subfolder}' and '{root}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    res = service.files().list(q=q, fields="files(id)", spaces="drive").execute()
    if res.get("files"):
        parent = res["files"][0]["id"]
    else:
        parent = service.files().create(body={"name": subfolder, "parents": [root],
                                              "mimeType": "application/vnd.google-apps.folder"}, fields="id").execute()["id"]
    media = MediaIoBaseUpload(io.BytesIO(content), mimetype=mime, resumable=False)
    f = service.files().create(body={"name": filename, "parents": [parent]}, media_body=media,
                               fields="id, webViewLink, webContentLink").execute()
    service.permissions().create(fileId=f["id"], body={"type": "anyone", "role": "reader"}).execute()
    return {"provider": "google_drive", "file_id": f["id"], "view_url": f.get("webViewLink"),
            "url": f"https://drive.google.com/thumbnail?id={f['id']}&sz=w1200",
            "download_url": f.get("webContentLink")}


async def drive_upload(db, content: bytes, filename: str, mime: str, subfolder: str):
    creds = await get_credentials(db)
    if not creds:
        return None
    return await asyncio.to_thread(_drive_upload_sync, creds, content, filename, mime, subfolder)


# ---------------- Calendar ----------------
def _busy_sync(creds, start: datetime, end: datetime):
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    res = service.freebusy().query(body={"timeMin": start.isoformat(), "timeMax": end.isoformat(),
                                         "items": [{"id": "primary"}]}).execute()
    out = []
    for b in res.get("calendars", {}).get("primary", {}).get("busy", []):
        out.append((datetime.fromisoformat(b["start"].replace("Z", "+00:00")),
                    datetime.fromisoformat(b["end"].replace("Z", "+00:00"))))
    return out


async def calendar_busy(db, start: datetime, end: datetime):
    creds = await get_credentials(db)
    if not creds:
        return None
    try:
        return await asyncio.to_thread(_busy_sync, creds, start, end)
    except Exception as e:
        logger.error(f"freebusy failed: {e}")
        return None


def _create_event_sync(creds, summary, description, start: datetime, end: datetime, attendees):
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    body = {"summary": summary, "description": description,
            "start": {"dateTime": start.isoformat(), "timeZone": "Asia/Jakarta"},
            "end": {"dateTime": end.isoformat(), "timeZone": "Asia/Jakarta"},
            "attendees": [{"email": a} for a in attendees if a],
            "conferenceData": {"createRequest": {"requestId": f"sx-{int(start.timestamp())}",
                                                 "conferenceSolutionKey": {"type": "hangoutsMeet"}}},
            "reminders": {"useDefault": True}}
    ev = service.events().insert(calendarId="primary", body=body, conferenceDataVersion=1, sendUpdates="all").execute()
    return {"event_id": ev["id"], "html_link": ev.get("htmlLink"), "meet_link": ev.get("hangoutLink")}


async def calendar_create_event(db, summary, description, start, end, attendees):
    creds = await get_credentials(db)
    if not creds:
        return None
    return await asyncio.to_thread(_create_event_sync, creds, summary, description, start, end, attendees)


def _delete_event_sync(creds, event_id):
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    service.events().delete(calendarId="primary", eventId=event_id, sendUpdates="all").execute()


async def calendar_delete_event(db, event_id):
    creds = await get_credentials(db)
    if not creds or not event_id:
        return
    try:
        await asyncio.to_thread(_delete_event_sync, creds, event_id)
    except Exception as e:
        logger.error(f"delete event failed: {e}")
