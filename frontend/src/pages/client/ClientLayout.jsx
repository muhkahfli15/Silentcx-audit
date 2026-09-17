import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/silentcx/shell";
import { Loading, ErrorState } from "@/components/silentcx/primitives";
import {
  LayoutDashboard, ClipboardList, Store, FileBarChart, AlertTriangle,
  Lightbulb, Receipt, FolderOpen, UserCog, BarChart3, Swords, RefreshCw, CalendarClock,
} from "lucide-react";

export const useClient = () => useOutletContext();

export default function ClientLayout() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(() => {
    setErr(null);
    api.overview().then(setData).catch(() => setErr("Failed to load dashboard"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const ent = data?.entitlements || [];
  const has = (f) => ent.includes(f);

  const nav = [
    { label: "Portal", items: [
      { to: "/app", end: true, label: "Overview", icon: LayoutDashboard },
      { to: "/app/audits", label: "Audits", icon: ClipboardList },
      { to: "/app/outlets", label: "Outlets", icon: Store },
      { to: "/app/reports", label: "Reports", icon: FileBarChart },
    ]},
    { label: "Insights", items: [
      { to: "/app/findings", label: "Findings", icon: AlertTriangle },
      { to: "/app/recommendations", label: "Recommendations", icon: Lightbulb },
      ...(has("multi_outlet") ? [{ to: "/app/benchmark", label: "Benchmark", icon: BarChart3 }] : []),
      ...(has("competitor_benchmark") ? [{ to: "/app/competitor", label: "Competitor", icon: Swords }] : []),
      ...(has("re_audit_comparison") ? [{ to: "/app/re-audit", label: "Re-Audit", icon: RefreshCw }] : []),
      ...(has("consultation") ? [{ to: "/app/consultation", label: "Consultation", icon: CalendarClock }] : []),
    ]},
    { label: "Account", items: [
      { to: "/app/billing", label: "Billing", icon: Receipt },
      { to: "/app/documents", label: "Documents", icon: FolderOpen },
      { to: "/app/account", label: "Account", icon: UserCog },
    ]},
  ];

  return (
    <DashboardShell nav={nav} title="Client Portal" notifications={data?.notifications || []}>
      {err ? <ErrorState message={err} onRetry={load} /> : !data ? <Loading /> : <Outlet context={{ data, reload: load, has }} />}
    </DashboardShell>
  );
}
