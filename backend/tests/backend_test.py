"""SilentCX backend regression tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://silentcx-audit.preview.emergentagent.com"
API = f"{BASE_URL}/api"

DEMO = {
    "admin": ("admin@silentcx.demo", "demo123"),
    "essential": ("essential@silentcx.demo", "demo123"),
    "insight": ("insight@silentcx.demo", "demo123"),
    "performance": ("performance@silentcx.demo", "demo123"),
    "shopper": ("shopper@silentcx.demo", "demo123"),
}


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()


def _hdr(token):
    return {"Authorization": f"Bearer {token}"}


# --------- Public / catalog ---------
class TestPublic:
    def test_packages(self):
        r = requests.get(f"{API}/packages", timeout=30)
        assert r.status_code == 200
        data = r.json()
        keys = {p["key"] for p in data}
        assert {"essential", "insight", "performance"}.issubset(keys)

    def test_addons(self):
        r = requests.get(f"{API}/addons", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_cms(self):
        r = requests.get(f"{API}/cms", timeout=30)
        assert r.status_code == 200
        assert "hero_title" in r.json() or "hero" in r.json()

    def test_score_thresholds(self):
        r = requests.get(f"{API}/score-thresholds", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --------- Auth ---------
class TestAuth:
    @pytest.mark.parametrize("role", list(DEMO.keys()))
    def test_demo_logins(self, role):
        email, pw = DEMO[role]
        data = _login(email, pw)
        assert "token" in data and "user" in data
        expected_role = "admin" if role == "admin" else ("shopper" if role == "shopper" else "client")
        assert data["user"]["role"] == expected_role
        # password_hash never leaks
        assert "password_hash" not in data["user"]

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@silentcx.demo", "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me(self):
        d = _login(*DEMO["admin"])
        r = requests.get(f"{API}/auth/me", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO["admin"][0]

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401


# --------- Client ---------
class TestClient:
    def test_essential_entitlements(self):
        d = _login(*DEMO["essential"])
        r = requests.get(f"{API}/client/overview", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        ov = r.json()
        ents = set(ov.get("entitlements", []))
        # Essential should NOT have advanced modules
        assert "competitor_benchmark" not in ents
        assert "re_audit_comparison" not in ents
        assert "consultation" not in ents

    def test_insight_entitlements(self):
        d = _login(*DEMO["insight"])
        r = requests.get(f"{API}/client/overview", headers=_hdr(d["token"]), timeout=30)
        ov = r.json()
        ents = set(ov.get("entitlements", []))
        assert "competitor_benchmark" in ents
        assert "re_audit_comparison" not in ents

    def test_performance_entitlements(self):
        d = _login(*DEMO["performance"])
        r = requests.get(f"{API}/client/overview", headers=_hdr(d["token"]), timeout=30)
        ov = r.json()
        ents = set(ov.get("entitlements", []))
        assert "re_audit_comparison" in ents
        assert "consultation" in ents
        assert "competitor_benchmark" not in ents

    @pytest.mark.parametrize("role,project_id", [
        ("essential", "PRJ-1001"),
        ("insight", "PRJ-1002"),
        ("performance", "PRJ-1003"),
    ])
    def test_reports(self, role, project_id):
        d = _login(*DEMO[role])
        r = requests.get(f"{API}/reports/{project_id}", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["report"]["project_id"] == project_id

    def test_report_forbidden_for_other_client(self):
        d = _login(*DEMO["essential"])
        r = requests.get(f"{API}/reports/PRJ-1003", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 403

    def test_pay_invoice(self):
        d = _login(*DEMO["essential"])
        ov = requests.get(f"{API}/client/overview", headers=_hdr(d["token"]), timeout=30).json()
        invoices = ov.get("invoices", [])
        assert invoices, "no invoices for essential client"
        inv_id = invoices[0]["invoice_id"]
        r = requests.post(f"{API}/invoices/{inv_id}/pay", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        # verify persisted
        ov2 = requests.get(f"{API}/client/overview", headers=_hdr(d["token"]), timeout=30).json()
        inv = next(i for i in ov2["invoices"] if i["invoice_id"] == inv_id)
        assert inv["status"] == "paid"


# --------- Registration & onboarding ---------
class TestOnboarding:
    def test_register_and_onboard(self):
        email = f"test_{uuid.uuid4().hex[:8]}@silentcx.demo"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST User", "email": email, "whatsapp": "+62111", "password": "demo123"
        }, timeout=30)
        assert r.status_code == 200, r.text
        token = r.json()["token"]

        payload = {
            "company": {"name": "TEST Co", "industry": "F&B", "city": "Jakarta"},
            "package_key": "insight",
            "addons": ["competitor_benchmark"],
            "outlets": [{"name": "Main", "city": "Jakarta"}],
            "objectives": ["Improve service"],
            "documents": [],
        }
        r = requests.post(f"{API}/onboarding", json=payload, headers=_hdr(token), timeout=30)
        assert r.status_code == 200, r.text
        out = r.json()
        assert out["project_id"].startswith("PRJ-")
        assert out["invoice_id"].startswith("INV-")

        # verify overview reflects new project
        ov = requests.get(f"{API}/client/overview", headers=_hdr(token), timeout=30).json()
        assert any(p["project_id"] == out["project_id"] for p in ov["projects"])


# --------- Shopper ---------
class TestShopper:
    def test_home(self):
        d = _login(*DEMO["shopper"])
        r = requests.get(f"{API}/shopper/home", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert "assignments" in body and "payments" in body

    def test_assignment_detail(self):
        d = _login(*DEMO["shopper"])
        home = requests.get(f"{API}/shopper/home", headers=_hdr(d["token"]), timeout=30).json()
        assignments = home.get("assignments", [])
        assert assignments, "no assignments for shopper"
        # Try to find asg_1 else pick any
        aid = next((a["id"] for a in assignments if a["id"] == "asg_1"), assignments[0]["id"])
        r = requests.get(f"{API}/shopper/assignments/{aid}", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        assert "assignment" in r.json()


# --------- Admin ---------
class TestAdmin:
    def test_dashboard(self):
        d = _login(*DEMO["admin"])
        r = requests.get(f"{API}/admin/dashboard", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        body = r.json()
        for k in ["total_clients", "active_shoppers", "action_items"]:
            assert k in body

    @pytest.mark.parametrize("coll", ["clients", "shoppers", "applications", "projects",
                                      "invoices", "outlets", "companies", "questionnaires",
                                      "packages", "addons"])
    def test_admin_list(self, coll):
        d = _login(*DEMO["admin"])
        r = requests.get(f"{API}/admin/{coll}", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_forbidden_for_client(self):
        d = _login(*DEMO["essential"])
        r = requests.get(f"{API}/admin/dashboard", headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 403

    def test_cms_update_and_reflect(self):
        d = _login(*DEMO["admin"])
        new_title = f"TEST Hero {uuid.uuid4().hex[:4]}"
        r = requests.patch(f"{API}/admin/cms", json={"hero_title": new_title, "status": "published"},
                           headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        # public should reflect
        pub = requests.get(f"{API}/cms", timeout=30).json()
        assert pub.get("hero_title") == new_title

    def test_package_edit(self):
        d = _login(*DEMO["admin"])
        pkgs = requests.get(f"{API}/admin/packages", headers=_hdr(d["token"]), timeout=30).json()
        assert pkgs
        pk = pkgs[0]
        new_price = pk.get("price", 1000000) + 1
        r = requests.patch(f"{API}/admin/packages/{pk['id']}", json={"price": new_price},
                           headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        assert r.json()["price"] == new_price

    def test_addon_toggle(self):
        d = _login(*DEMO["admin"])
        addons = requests.get(f"{API}/admin/addons", headers=_hdr(d["token"]), timeout=30).json()
        assert addons
        a = addons[0]
        new_state = not a.get("active", True)
        r = requests.patch(f"{API}/admin/addons/{a['id']}", json={"active": new_state},
                           headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        assert r.json()["active"] == new_state
        # revert
        requests.patch(f"{API}/admin/addons/{a['id']}", json={"active": a.get("active", True)},
                       headers=_hdr(d["token"]), timeout=30)

    def test_application_action(self):
        d = _login(*DEMO["admin"])
        apps = requests.get(f"{API}/admin/applications", headers=_hdr(d["token"]), timeout=30).json()
        if not apps:
            pytest.skip("no applications")
        app_id = apps[0]["id"]
        r = requests.post(f"{API}/admin/applications/{app_id}/action",
                          json={"action": "review"}, headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "under_review"

    def test_project_publish(self):
        d = _login(*DEMO["admin"])
        r = requests.post(f"{API}/admin/projects/PRJ-1001/status",
                          json={"status": "report_published"}, headers=_hdr(d["token"]), timeout=30)
        assert r.status_code == 200
