"""SilentCX entitlement resolution logic. Single source of truth for module access."""

# Base entitlements per package. Each higher tier inherits the lower tier's flags.
ESSENTIAL = {
    "basic_report", "audit_list", "outlet_list", "cx_score",
    "category_scores", "key_findings", "quick_recommendations",
    "pdf", "billing", "documents",
}

INSIGHT_ADD = {
    "detailed_findings", "actionable_recommendations", "sop_compliance",
    "customer_journey", "gap_analysis", "severity", "management_summary", "evidence",
}

PERFORMANCE_ADD = {
    "multi_outlet", "outlet_ranking", "benchmarking",
    "cross_outlet_trends", "best_outlet", "lowest_outlet",
    "score_gap", "critical_outlet", "red_flags",
}

# Add-on -> entitlement flags it unlocks
ADDON_ENTITLEMENTS = {
    "competitor_benchmark": {"competitor_benchmark"},
    "re_audit": {"re_audit_comparison"},
    "additional_consultation": {"consultation"},
    "priority_report": {"priority"},
    "custom_questionnaire": {"custom_scope"},
    "additional_visit": {"additional_visit"},
    "additional_outlet": {"additional_outlet"},
    "out_of_city": {"out_of_city"},
    "excess_purchase": {"excess_purchase"},
}


def resolve_entitlements(package_key: str, selected_addons: list) -> list:
    flags = set()
    if package_key in ("essential", "insight", "performance"):
        flags |= ESSENTIAL
    if package_key in ("insight", "performance"):
        flags |= INSIGHT_ADD
    if package_key == "performance":
        flags |= PERFORMANCE_ADD
    for a in (selected_addons or []):
        key = a if isinstance(a, str) else a.get("key")
        flags |= ADDON_ENTITLEMENTS.get(key, set())
    return sorted(flags)
