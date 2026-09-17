import os
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger("silentcx.notify")


async def send_email(db, to: str, subject: str, body: str, kind: str):
    """Email delivery is MOCKED: logged + stored in db.email_log until RESEND_API_KEY is configured."""
    entry = {"id": str(uuid.uuid4()), "to": to, "subject": subject, "body": body, "kind": kind,
             "provider": "mock", "status": "logged", "created_at": datetime.now(timezone.utc).isoformat()}
    if os.environ.get("RESEND_API_KEY"):
        entry["provider"] = "resend"
        entry["status"] = "not_implemented"
    logger.info(f"[EMAIL:{kind}] to={to} subject={subject!r}")
    await db.email_log.insert_one(dict(entry))
    return entry


async def notify(db, user_id: str, title: str, body: str, kind: str = "general", link: str = None, email: bool = True):
    now = datetime.now(timezone.utc).isoformat()
    await db.notifications.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "title": title, "body": body,
                                       "kind": kind, "link": link, "read": False, "created_at": now})
    if email:
        user = await db.users.find_one({"id": user_id})
        if user and user.get("email"):
            await send_email(db, user["email"], f"[SilentCX] {title}", body, kind)


async def notify_admins(db, title: str, body: str, kind: str = "admin", link: str = None):
    async for a in db.users.find({"role": "admin"}):
        await notify(db, a["id"], title, body, kind, link)
