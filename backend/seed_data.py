"""Realistic SilentCX demo data. Programmatically builds companies, outlets, projects,
reports, invoices, shoppers, assignments, submissions, questionnaires, CMS, notifications."""
import uuid
from datetime import datetime, timezone, timedelta

from entitlements import resolve_entitlements
from catalog import PACKAGES, ADDONS

NOW = datetime.now(timezone.utc)


def iso(dt):
    return dt.isoformat()


def _pkg(key):
    return next(p for p in PACKAGES if p["key"] == key)


def _addon(key):
    return next(a for a in ADDONS if a["key"] == key)


def rating(score):
    if score >= 90: return "Excellent"
    if score >= 80: return "Good"
    if score >= 70: return "Needs Attention"
    if score >= 60: return "Poor"
    return "Critical"


EVIDENCE = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    "https://images.unsplash.com/photo-1526745925052-dd824d27b9ab?w=800&q=80",
    "https://images.unsplash.com/photo-1608979827489-2b855e79debe?w=800&q=80",
    "https://images.unsplash.com/photo-1744776411221-702f2848b0b2?w=800&q=80",
]

CATEGORY_TEMPLATE = [
    ("Greeting & Service Attitude", 20),
    ("Product Knowledge", 15),
    ("Order Accuracy", 15),
    ("Service Speed", 15),
    ("Cleanliness & Ambience", 20),
    ("Upselling / Closing", 15),
]

JOURNEY_TEMPLATE = ["Arrival", "Greeting", "Ordering", "Waiting", "Service", "Payment", "Departure"]

SOP_ITEMS = [
    "Staff greeted within 30 seconds",
    "Menu / product recommendation offered",
    "Order repeated back for accuracy",
    "Hygiene standards visible at counter",
    "Uniform & grooming compliant",
    "Payment area clean and organised",
    "Farewell / thank-you given",
]


def build_report(project_id, outlet_id, outlet_name, company, audit_id, pkg_key,
                 overall, audit_date, addons=None, published=True):
    addons = addons or []
    cats = []
    for i, (name, weight) in enumerate(CATEGORY_TEMPLATE):
        s = max(35, min(100, overall + (7 - i * 4)))
        cats.append({"name": name, "score": s, "weight": weight, "rating": rating(s)})

    journey = []
    for i, stage in enumerate(JOURNEY_TEMPLATE):
        s = max(40, min(100, overall + (5 - i * 3) + (i % 2) * 6))
        sentiment = "positive" if s >= 80 else ("neutral" if s >= 65 else "negative")
        journey.append({"stage": stage, "score": s, "sentiment": sentiment,
                        "note": f"{stage} experience rated {rating(s).lower()}."})

    sop_items = []
    for i, item in enumerate(SOP_ITEMS):
        st = "pass" if (overall + i * 3) % 100 >= 70 else ("deviation" if i % 2 else "fail")
        sop_items.append({"item": item, "status": st,
                          "note": "Compliant" if st == "pass" else "Observed gap during visit"})
    sop_score = round(sum(1 for x in sop_items if x["status"] == "pass") / len(sop_items) * 100)

    severities = ["critical", "high", "medium", "low", "medium"]
    finding_titles = [
        ("Slow service during peak hour", "Service Speed"),
        ("Staff lacked product knowledge on new menu", "Product Knowledge"),
        ("Restroom cleanliness below standard", "Cleanliness & Ambience"),
        ("No upselling attempt at checkout", "Upselling / Closing"),
        ("Greeting delayed beyond SOP threshold", "Greeting & Service Attitude"),
    ]
    findings = []
    for i, (title, cat) in enumerate(finding_titles):
        findings.append({
            "id": f"F-{audit_id}-{i+1}", "title": title, "category": cat,
            "outlet": outlet_name,
            "description": f"During the mystery visit, {title.lower()} was observed and documented with evidence.",
            "severity": severities[i], "status": "open" if i < 3 else "in_progress",
            "related_question": f"Q{i+3}", "evidence": [EVIDENCE[i % len(EVIDENCE)]],
        })

    rec_titles = [
        ("Introduce peak-hour staffing roster", "Immediate", "Operations"),
        ("Run new-menu product training", "Immediate", "Training"),
        ("Implement hourly cleanliness checklist", "30-Day", "Operations"),
        ("Add upsell prompt at POS", "30-Day", "Sales"),
        ("Coach team on greeting SOP", "90-Day", "Training"),
    ]
    recs = []
    for i, (title, prio, area) in enumerate(rec_titles):
        recs.append({
            "id": f"R-{audit_id}-{i+1}", "title": title,
            "action": f"{title} to close the related finding and lift CX score.",
            "priority": prio, "responsible_area": area,
            "related_finding": f"F-{audit_id}-{i+1}",
            "status": "open" if i < 4 else "in_progress",
            "target_date": iso(NOW + timedelta(days=14 * (i + 1))),
        })

    report = {
        "id": f"rep_{project_id}_{outlet_id}",
        "project_id": project_id, "outlet_id": outlet_id, "outlet_name": outlet_name,
        "client_company": company, "audit_id": audit_id, "package_key": pkg_key,
        "package_name": _pkg(pkg_key)["name"], "audit_date": iso(audit_date),
        "status": "published" if published else "draft",
        "overall_cx_score": overall, "overall_rating": rating(overall),
        "category_scores": cats, "customer_journey": journey,
        "sop_compliance": {"score": sop_score, "items": sop_items},
        "findings": findings, "recommendations": recs,
        "evidence": [{"url": u, "caption": c} for u, c in zip(
            EVIDENCE, ["Counter area", "Product display", "Service zone", "Ambience"])],
        "executive_summary": (
            f"The mystery visit at {outlet_name} yielded an overall CX score of {overall} "
            f"({rating(overall)}). Service fundamentals were {'solid' if overall >= 80 else 'inconsistent'}, "
            "with clear opportunities in speed, product knowledge and cleanliness."),
        "management_summary": (
            "Management should prioritise peak-hour staffing and new-menu training, which together "
            "account for the largest score gaps. Quick wins can lift the score by an estimated 6–9 points "
            "within 30 days."),
        "generated_at": iso(NOW),
    }

    if "competitor_benchmark" in addons:
        report["competitor_benchmark"] = {
            "competitor_name": "Aroma House (Competitor)",
            "metrics": [
                {"metric": "Overall CX Score", "client": overall, "competitor": overall - 4},
                {"metric": "Service", "client": overall + 2, "competitor": overall - 6},
                {"metric": "Product Knowledge", "client": overall - 5, "competitor": overall + 3},
                {"metric": "Service Speed", "client": overall - 3, "competitor": overall + 5},
                {"metric": "Cleanliness", "client": overall + 4, "competitor": overall - 2},
                {"metric": "Upselling", "client": overall - 8, "competitor": overall + 6},
            ],
            "strengths": ["Warmer greeting", "Cleaner ambience", "Faster payment"],
            "weaknesses": ["Weaker upselling", "Lower product knowledge on new items"],
        }
    if "re_audit" in addons:
        report["re_audit"] = {
            "initial_score": overall - 11, "reaudit_score": overall,
            "delta": 11, "resolved_findings": 3, "new_findings": 1,
            "trend": "improvement",
            "items": [
                {"finding": "Slow service during peak hour", "before": "open", "after": "resolved"},
                {"finding": "Restroom cleanliness below standard", "before": "open", "after": "resolved"},
                {"finding": "No upselling attempt", "before": "open", "after": "in_progress"},
            ],
        }
    return report


def build():
    users, companies, outlets, projects, reports, invoices = [], [], [], [], [], []
    applications, assignments, submissions, notifications, consultations = [], [], [], [], []

    def user(email, name, role, extra=None):
        u = {"id": str(uuid.uuid4()), "email": email, "name": name, "role": role,
             "whatsapp": "+62 812-0000-0000", "created_at": iso(NOW), "status": "active"}
        if extra:
            u.update(extra)
        return u

    # ---------- CLIENT A: Essential ----------
    ca = user("essential@silentcx.demo", "Rani Wijaya", "client",
              {"onboarding_complete": True, "client_id": "CLT-1001"})
    comp_a = {"id": "comp_a", "client_id": ca["id"], "name": "Kopi Senja",
              "industry": "F&B / Cafe", "company_type": "Independent", "city": "Jakarta",
              "address": "Jl. Thamrin No. 12, Jakarta", "website": "kopisenja.id",
              "instagram": "@kopisenja", "contact_person": "Rani Wijaya", "position": "Owner"}
    out_a = {"id": "out_a1", "client_id": ca["id"], "company_id": "comp_a",
             "name": "Kopi Senja Thamrin", "city": "Jakarta", "address": "Jl. Thamrin No. 12",
             "status": "active", "latest_cx": 74, "latest_sop": 71,
             "last_audit": iso(NOW - timedelta(days=6))}
    ent_a = resolve_entitlements("essential", [])
    proj_a = {"id": "prj_a", "project_id": "PRJ-1001", "client_id": ca["id"], "company_id": "comp_a",
              "package_key": "essential", "package_snapshot": _pkg("essential"),
              "addons": [], "addon_snapshot": [], "entitlements": ent_a,
              "outlets": ["out_a1"], "status": "report_published",
              "objectives": ["Evaluate barista service", "Assess cleanliness"],
              "created_at": iso(NOW - timedelta(days=20)),
              "purchase_allowance": 150000}
    rep_a = build_report("PRJ-1001", "out_a1", "Kopi Senja Thamrin", "Kopi Senja",
                         "AUD-1001", "essential", 74, NOW - timedelta(days=6))
    inv_a = {"id": "inv_a", "invoice_id": "INV-1001", "project_id": "PRJ-1001", "client_id": ca["id"],
             "client": "Kopi Senja", "package": "SilentCX Essential", "outlet_count": 1,
             "base_price": 1249000, "items": [
                 {"label": "SilentCX Essential (1 outlet)", "amount": 1249000}],
             "addons_total": 0, "reimbursement": 0, "out_of_city": 0, "discount": 0,
             "subtotal": 1249000, "total": 1249000, "status": "paid",
             "created_at": iso(NOW - timedelta(days=20))}

    # ---------- CLIENT B: Insight + Competitor ----------
    cb = user("insight@silentcx.demo", "Dimas Prakoso", "client",
              {"onboarding_complete": True, "client_id": "CLT-1002"})
    comp_b = {"id": "comp_b", "client_id": cb["id"], "name": "Glow Beauty Clinic",
              "industry": "Beauty & Wellness / Clinic", "company_type": "Chain", "city": "Jakarta",
              "address": "Jl. Kemang Raya No. 45", "website": "glowclinic.id",
              "instagram": "@glowclinic", "contact_person": "Dimas Prakoso", "position": "Operations Manager"}
    out_b = {"id": "out_b1", "client_id": cb["id"], "company_id": "comp_b",
             "name": "Glow Beauty Clinic Kemang", "city": "Jakarta", "address": "Jl. Kemang Raya No. 45",
             "status": "active", "latest_cx": 83, "latest_sop": 80,
             "last_audit": iso(NOW - timedelta(days=4))}
    ent_b = resolve_entitlements("insight", ["competitor_benchmark"])
    proj_b = {"id": "prj_b", "project_id": "PRJ-1002", "client_id": cb["id"], "company_id": "comp_b",
              "package_key": "insight", "package_snapshot": _pkg("insight"),
              "addons": ["competitor_benchmark"],
              "addon_snapshot": [_addon("competitor_benchmark")], "entitlements": ent_b,
              "outlets": ["out_b1"], "status": "report_published",
              "objectives": ["Full CX diagnostic", "Benchmark vs competitor"],
              "created_at": iso(NOW - timedelta(days=18)), "purchase_allowance": 150000}
    rep_b = build_report("PRJ-1002", "out_b1", "Glow Beauty Clinic Kemang", "Glow Beauty Clinic",
                         "AUD-1002", "insight", 83, NOW - timedelta(days=4),
                         addons=["competitor_benchmark"])
    inv_b = {"id": "inv_b", "invoice_id": "INV-1002", "project_id": "PRJ-1002", "client_id": cb["id"],
             "client": "Glow Beauty Clinic", "package": "SilentCX Insight", "outlet_count": 1,
             "base_price": 1749000, "items": [
                 {"label": "SilentCX Insight (1 outlet)", "amount": 1749000},
                 {"label": "Competitor Benchmark Audit", "amount": 1299000}],
             "addons_total": 1299000, "reimbursement": 0, "out_of_city": 0, "discount": 0,
             "subtotal": 3048000, "total": 3048000, "status": "unpaid",
             "created_at": iso(NOW - timedelta(days=18))}

    # ---------- CLIENT C: Performance + Re-Audit + Consultation ----------
    cc = user("performance@silentcx.demo", "Sarah Tanoto", "client",
              {"onboarding_complete": True, "client_id": "CLT-1003"})
    comp_c = {"id": "comp_c", "client_id": cc["id"], "name": "Northstar Coffee",
              "industry": "F&B / Restaurant", "company_type": "Franchise / Multi-Outlet", "city": "Makassar",
              "address": "Jl. Pettarani No. 1", "website": "northstar.coffee",
              "instagram": "@northstar.coffee", "contact_person": "Sarah Tanoto", "position": "Regional Director"}
    northstar = [
        ("out_c1", "Northstar Pettarani", 91), ("out_c2", "Northstar Panakkukang", 82),
        ("out_c3", "Northstar CPI", 68), ("out_c4", "Northstar Gowa", 87),
        ("out_c5", "Northstar Maros", 76),
    ]
    for oid, nm, sc in northstar:
        outlets.append({"id": oid, "client_id": cc["id"], "company_id": "comp_c", "name": nm,
                        "city": "Makassar", "address": "Makassar", "status": "active",
                        "latest_cx": sc, "latest_sop": max(55, sc - 5),
                        "last_audit": iso(NOW - timedelta(days=3))})
    ent_c = resolve_entitlements("performance", ["re_audit", "additional_consultation"])
    proj_c = {"id": "prj_c", "project_id": "PRJ-1003", "client_id": cc["id"], "company_id": "comp_c",
              "package_key": "performance", "package_snapshot": _pkg("performance"),
              "addons": ["re_audit", "additional_consultation"],
              "addon_snapshot": [_addon("re_audit"), _addon("additional_consultation")],
              "entitlements": ent_c, "outlets": [o[0] for o in northstar],
              "status": "report_published",
              "objectives": ["Benchmark 5 outlets", "Identify critical branch", "Re-audit weakest outlet"],
              "created_at": iso(NOW - timedelta(days=25)), "purchase_allowance": 150000}
    # main report on the best outlet, with performance comparison + re-audit
    rep_c = build_report("PRJ-1003", "out_c1", "Northstar Pettarani", "Northstar Coffee",
                         "AUD-1003", "performance", 91, NOW - timedelta(days=3),
                         addons=["re_audit"])
    rep_c["outlet_comparison"] = [
        {"outlet": nm, "score": sc, "sop": max(55, sc - 5), "rating": rating(sc)}
        for _, nm, sc in northstar]
    ranked = sorted(northstar, key=lambda x: -x[2])
    rep_c["outlet_ranking"] = [{"rank": i + 1, "outlet": nm, "score": sc}
                               for i, (_, nm, sc) in enumerate(ranked)]
    rep_c["best_outlet"] = {"outlet": ranked[0][1], "score": ranked[0][2]}
    rep_c["lowest_outlet"] = {"outlet": ranked[-1][1], "score": ranked[-1][2]}
    rep_c["score_gap"] = ranked[0][2] - ranked[-1][2]
    rep_c["critical_outlet"] = {"outlet": "Northstar CPI", "score": 68,
                                "red_flags": ["Restroom cleanliness fail", "Long wait time", "No upsell"]}
    inv_c = {"id": "inv_c", "invoice_id": "INV-1003", "project_id": "PRJ-1003", "client_id": cc["id"],
             "client": "Northstar Coffee", "package": "SilentCX Performance", "outlet_count": 5,
             "base_price": 5399000, "items": [
                 {"label": "SilentCX Performance (5 outlets)", "amount": 5399000},
                 {"label": "Re-Audit (Northstar CPI)", "amount": 899000},
                 {"label": "Additional Consultation", "amount": 499000},
                 {"label": "Excess Purchase Reimbursement", "amount": 80000}],
             "addons_total": 1398000, "reimbursement": 80000, "out_of_city": 0, "discount": 200000,
             "subtotal": 6877000, "total": 6677000, "status": "partial",
             "created_at": iso(NOW - timedelta(days=25))}
    consultations.append({"id": "cons_c", "project_id": "PRJ-1003", "client_id": cc["id"],
                          "status": "scheduled", "scheduled_at": iso(NOW + timedelta(days=3)),
                          "topic": "Performance review & remediation roadmap"})

    users += [ca, cb, cc]
    companies += [comp_a, comp_b, comp_c]
    outlets += [out_a, out_b]
    projects += [proj_a, proj_b, proj_c]
    reports += [rep_a, rep_b, rep_c]
    invoices += [inv_a, inv_b, inv_c]

    # ---------- SHOPPER ----------
    shopper = user("shopper@silentcx.demo", "Bayu Saputra", "shopper", {
        "status": "verified", "city": "Jakarta", "dob": "1995-04-12", "gender": "Male",
        "occupation": "Freelancer", "available_cities": ["Jakarta", "Bogor", "Depok"],
        "transportation": "Motorcycle", "experience": "2 years mystery shopping",
        "preferred_industry": "F&B", "bank": "BCA •••• 4821", "rating": 4.8,
        "verified_at": iso(NOW - timedelta(days=30))})
    users.append(shopper)

    # Pending applications for admin verification
    applications += [
        {"id": "app_1", "name": "Nadia Kusuma", "email": "nadia@shop.demo", "whatsapp": "+62 813-1111-2222",
         "city": "Bandung", "gender": "Female", "occupation": "Student", "experience": "New",
         "preferred_industry": "Retail", "status": "pending", "created_at": iso(NOW - timedelta(days=2))},
        {"id": "app_2", "name": "Rizky Hidayat", "email": "rizky@shop.demo", "whatsapp": "+62 814-3333-4444",
         "city": "Surabaya", "gender": "Male", "occupation": "Marketing", "experience": "1 year",
         "preferred_industry": "F&B", "status": "under_review", "created_at": iso(NOW - timedelta(days=3))},
        {"id": "app_3", "name": "Putri Ananda", "email": "putri@shop.demo", "whatsapp": "+62 815-5555-6666",
         "city": "Jakarta", "gender": "Female", "occupation": "Nurse", "experience": "3 years",
         "preferred_industry": "Healthcare", "status": "revision_required", "created_at": iso(NOW - timedelta(days=4))},
        {"id": "app_4", "name": "Andi Saputra", "email": "andi@shop.demo", "whatsapp": "+62 816-7777-8888",
         "city": "Makassar", "gender": "Male", "occupation": "Driver", "experience": "6 months",
         "preferred_industry": "Automotive", "status": "pending", "created_at": iso(NOW - timedelta(days=1))},
    ]

    # Assignments for the verified shopper
    assignments += [
        {"id": "asg_1", "audit_id": "AUD-2001", "project_id": "PRJ-1002", "shopper_id": shopper["id"],
         "outlet": "Glow Beauty Clinic Kemang", "address": "Jl. Kemang Raya No. 45, Jakarta",
         "maps_link": "https://maps.google.com/?q=Kemang+Raya+45",
         "visit_window": "Tomorrow, 13:00 – 16:00", "scenario": "Pose as a walk-in customer inquiring about facial treatment.",
         "required_purchase": "1 consultation / product", "max_reimbursement": 150000,
         "instructions": "Observe greeting, product knowledge, cleanliness. Take discreet photos.",
         "status": "upcoming", "reward": 250000},
        {"id": "asg_2", "audit_id": "AUD-2002", "project_id": "PRJ-1001", "shopper_id": shopper["id"],
         "outlet": "Kopi Senja Thamrin", "address": "Jl. Thamrin No. 12, Jakarta",
         "maps_link": "https://maps.google.com/?q=Thamrin+12",
         "visit_window": "Today, 10:00 – 12:00", "scenario": "Order a coffee and a pastry, evaluate speed and upsell.",
         "required_purchase": "1 beverage + 1 food", "max_reimbursement": 150000,
         "instructions": "Time the service. Note whether upsell is attempted.",
         "status": "pending_submission", "reward": 200000},
        {"id": "asg_3", "audit_id": "AUD-2003", "project_id": "PRJ-1003", "shopper_id": shopper["id"],
         "outlet": "Northstar CPI", "address": "CPI, Makassar", "maps_link": "https://maps.google.com/?q=CPI+Makassar",
         "visit_window": "Yesterday, 14:00 – 17:00", "scenario": "Full CX audit of the outlet.",
         "required_purchase": "1 meal", "max_reimbursement": 150000,
         "instructions": "Complete full questionnaire, upload receipt.",
         "status": "revision_required", "reward": 300000,
         "revision_note": "Please re-upload a clearer receipt photo and complete the cleanliness section."},
        {"id": "asg_4", "audit_id": "AUD-2004", "project_id": "PRJ-1003", "shopper_id": shopper["id"],
         "outlet": "Northstar Gowa", "address": "Gowa, Makassar", "maps_link": "https://maps.google.com/?q=Gowa",
         "visit_window": "Completed", "scenario": "Full CX audit.", "required_purchase": "1 meal",
         "max_reimbursement": 150000, "instructions": "Completed.", "status": "completed", "reward": 300000},
    ]

    submissions += [
        {"id": "sub_1", "assignment_id": "asg_4", "audit_id": "AUD-2004", "shopper_id": shopper["id"],
         "outlet": "Northstar Gowa", "status": "approved", "score": 87,
         "submitted_at": iso(NOW - timedelta(days=3)), "transaction_amount": 95000},
        {"id": "sub_2", "assignment_id": "asg_3", "audit_id": "AUD-2003", "shopper_id": shopper["id"],
         "outlet": "Northstar CPI", "status": "revision_required", "score": None,
         "submitted_at": iso(NOW - timedelta(days=1)), "transaction_amount": 120000},
    ]

    # Admin QC queue: one submission waiting review
    submissions.append(
        {"id": "sub_3", "assignment_id": "asg_x", "audit_id": "AUD-2005", "shopper_id": shopper["id"],
         "outlet": "Glow Beauty Clinic Kemang", "status": "under_review", "score": 81,
         "submitted_at": iso(NOW - timedelta(hours=5)), "transaction_amount": 140000})

    notifications += [
        {"id": "n1", "user_id": ca["id"], "title": "Report Published",
         "body": "Your Essential audit report for Kopi Senja Thamrin is ready.",
         "read": False, "created_at": iso(NOW - timedelta(days=6))},
        {"id": "n2", "user_id": cb["id"], "title": "Competitor Benchmark Ready",
         "body": "Benchmark comparison against Aroma House is available.",
         "read": False, "created_at": iso(NOW - timedelta(days=4))},
        {"id": "n3", "user_id": cc["id"], "title": "Consultation Scheduled",
         "body": "Your strategy consultation is scheduled in 3 days.",
         "read": False, "created_at": iso(NOW - timedelta(days=1))},
        {"id": "n4", "user_id": shopper["id"], "title": "Revision Requested",
         "body": "Admin requested a revision on your Northstar CPI submission.",
         "read": False, "created_at": iso(NOW - timedelta(hours=20))},
    ]

    return {
        "users": users, "companies": companies, "outlets": outlets, "projects": projects,
        "reports": reports, "invoices": invoices, "applications": applications,
        "assignments": assignments, "submissions": submissions,
        "notifications": notifications, "consultations": consultations,
    }


QUESTIONNAIRES = [
    {"id": "qn_fnb", "name": "F&B Standard Audit", "service_type": "Mystery Shopping",
     "active": True, "questions": [
        {"id": "q1", "question": "Were you greeted within 30 seconds?", "category": "Greeting & Service Attitude",
         "type": "yes_no", "weight": 10, "required": True, "evidence_required": False, "severity": "high", "order": 1},
        {"id": "q2", "question": "Rate the staff's product knowledge", "category": "Product Knowledge",
         "type": "scale_1_5", "weight": 15, "required": True, "evidence_required": False, "severity": "medium", "order": 2},
        {"id": "q3", "question": "Was your order accurate?", "category": "Order Accuracy",
         "type": "yes_no", "weight": 15, "required": True, "evidence_required": True, "severity": "high", "order": 3},
        {"id": "q4", "question": "Service speed rating (0–10)", "category": "Service Speed",
         "type": "scale_0_10", "weight": 15, "required": True, "evidence_required": False, "severity": "medium", "order": 4},
        {"id": "q5", "question": "Rate cleanliness & ambience", "category": "Cleanliness & Ambience",
         "type": "scale_1_5", "weight": 20, "required": True, "evidence_required": True, "severity": "high", "order": 5},
        {"id": "q6", "question": "Was an upsell attempted?", "category": "Upselling / Closing",
         "type": "yes_no", "weight": 10, "required": True, "evidence_required": False, "severity": "low", "order": 6},
        {"id": "q7", "question": "Additional notes", "category": "General",
         "type": "text", "weight": 0, "required": False, "evidence_required": False, "severity": "low", "order": 7},
        {"id": "q8", "question": "Transaction amount (IDR)", "category": "General",
         "type": "numeric", "weight": 0, "required": True, "evidence_required": False, "severity": "low", "order": 8},
        {"id": "q9", "question": "Upload receipt", "category": "General",
         "type": "evidence", "weight": 0, "required": True, "evidence_required": True, "severity": "low", "order": 9},
     ]},
    {"id": "qn_retail", "name": "Retail Insight Audit", "service_type": "CX Audit", "active": True, "questions": []},
    {"id": "qn_clinic", "name": "Beauty Clinic Insight", "service_type": "SOP Compliance", "active": True, "questions": []},
]

TEMPLATES = [
    {"id": "tpl_1", "name": "F&B Essential", "industry": "F&B", "package": "essential", "active": True},
    {"id": "tpl_2", "name": "F&B Insight", "industry": "F&B", "package": "insight", "active": True},
    {"id": "tpl_3", "name": "Retail Insight", "industry": "Retail", "package": "insight", "active": True},
    {"id": "tpl_4", "name": "Beauty Clinic Insight", "industry": "Beauty & Wellness", "package": "insight", "active": True},
    {"id": "tpl_5", "name": "Hotel Audit", "industry": "Hospitality", "package": "insight", "active": True},
    {"id": "tpl_6", "name": "Performance Audit", "industry": "Multi-Outlet", "package": "performance", "active": True},
]

CATEGORIES = [
    {"id": "cat_1", "name": "Greeting & Service Attitude", "weight": 20, "active": True},
    {"id": "cat_2", "name": "Product Knowledge", "weight": 15, "active": True},
    {"id": "cat_3", "name": "Order Accuracy", "weight": 15, "active": True},
    {"id": "cat_4", "name": "Service Speed", "weight": 15, "active": True},
    {"id": "cat_5", "name": "Cleanliness & Ambience", "weight": 20, "active": True},
    {"id": "cat_6", "name": "Upselling / Closing", "weight": 15, "active": True},
]


def default_cms():
    return {
        "id": "cms_main", "status": "published",
        "hero": {
            "eyebrow": "Customer Experience Intelligence",
            "title": "See your business through your customer's eyes",
            "subtitle": "SilentCX delivers discreet mystery shopping, rigorous CX audits and evidence-based recommendations for multi-outlet brands.",
            "cta_primary": "Request Audit Proposal", "cta_secondary": "Explore Sample Report",
            "stats": [{"value": "12k+", "label": "Audits Delivered"},
                      {"value": "480+", "label": "Outlets Covered"},
                      {"value": "98%", "label": "On-time Reports"}],
        },
        "problem": {
            "title": "You can't fix what you can't see",
            "items": [
                {"title": "CX Blindspots", "body": "Frontline service gaps stay invisible to management."},
                {"title": "Brand Inconsistency", "body": "Standards drift across outlets and shifts."},
                {"title": "Revenue Leakage", "body": "Missed upsells and poor experience quietly erode revenue."},
            ],
        },
        "methodology": {
            "title": "The SilentCX 4-Pillar Framework",
            "items": [
                {"title": "Discreet Inspection", "body": "Trained mystery shoppers experience your service unnoticed."},
                {"title": "Rigorous SOP Benchmark", "body": "Every touchpoint scored against your standards."},
                {"title": "Empirical Evidence", "body": "Photo and receipt evidence for every finding."},
                {"title": "Actionable Remediation", "body": "Prioritised recommendations management can execute."},
            ],
        },
        "industries": [
            {"name": "F&B & Cafe", "img": EVIDENCE[0]},
            {"name": "Luxury Retail", "img": EVIDENCE[1]},
            {"name": "Clinics & Healthcare", "img": EVIDENCE[2]},
            {"name": "Hospitality", "img": EVIDENCE[3]},
        ],
        "how_it_works": [
            {"step": 1, "title": "Choose Package", "body": "Select the tier that fits your goals."},
            {"step": 2, "title": "Onboard & Brief", "body": "Add outlets and audit objectives."},
            {"step": 3, "title": "Discreet Visit", "body": "Verified shoppers conduct the audit."},
            {"step": 4, "title": "Get Report", "body": "Receive an interactive report and PDF."},
        ],
        "testimonials": [
            {"name": "Andini R.", "role": "Director of Ops, Retail Chain",
             "quote": "SilentCX gave us the evidence to fix service gaps we didn't know existed. CX score up 14 points in a quarter.", "rating": 5},
            {"name": "Bagus S.", "role": "F&B Franchise Owner",
             "quote": "The multi-outlet benchmark showed exactly which branch needed help. Invaluable.", "rating": 5},
        ],
        "case_studies": [
            {"title": "Coffee chain lifts CX by 14 points", "industry": "F&B",
             "body": "A 5-outlet coffee brand used Performance audits to identify and remediate its weakest branch."},
            {"title": "Clinic closes SOP gaps in 30 days", "industry": "Healthcare",
             "body": "Insight audit with evidence drove a 22% compliance improvement."},
        ],
        "faq": [
            {"q": "Do staff know they're being audited?", "a": "No. Visits are fully discreet to capture authentic experience."},
            {"q": "How fast is the report?", "a": "Standard delivery is 5–7 business days, or express with the Priority add-on."},
            {"q": "Can you audit multiple cities?", "a": "Yes, with the Out-of-City assignment add-on."},
            {"q": "Is the report exportable?", "a": "Every report includes a branded, downloadable PDF."},
        ],
        "cta": {"title": "Ready to see what your customers see?",
                "subtitle": "Start with a single audit or roll out multi-outlet intelligence.",
                "button": "Request Audit Proposal"},
        "updated_at": iso(NOW),
    }
