import React from "react";
import { Link } from "react-router-dom";
import { useClient } from "./ClientLayout";
import { PageHeader, StatCard, ScoreDial, StatusBadge, ScoreBadge, EmptyState, ProgressBar } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { Activity, CheckCircle2, Store, AlertTriangle, ShieldAlert, FileBarChart, CalendarClock, Swords, ArrowRight } from "lucide-react";

export default function Overview() {
  const { data, has } = useClient();
  const reports = data.reports || [];
  const consult = (data.consultations || [])[0];
  const criticalOutlet = reports.find((r) => r.critical_outlet)?.critical_outlet;

  return (
    <div className="sx-fade-up">
      <PageHeader title={`Welcome, ${data.projects[0] ? data.projects[0].company_id ? "" : "" : ""}`.trim() || "Overview"}
        subtitle={`Current package: ${data.current_package || "—"}`} testid="client-overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Audits" value={data.active_audits} icon={Activity} tone="gold" testid="stat-active" />
        <StatCard label="Completed" value={data.completed_audits} icon={CheckCircle2} tone="green" testid="stat-completed" />
        <StatCard label="Total Outlets" value={data.total_outlets} icon={Store} tone="blue" testid="stat-outlets" />
        <StatCard label="Avg CX Score" value={data.avg_cx || "—"} icon={FileBarChart} tone="gold" testid="stat-avgcx" />
        <StatCard label="Open Findings" value={data.open_findings} icon={AlertTriangle} tone="red" testid="stat-open-findings" />
        <StatCard label="Critical Findings" value={data.critical_findings} icon={ShieldAlert} tone="red" testid="stat-critical-findings" />
        {has("consultation") && <StatCard label="Consultation" value={consult ? "1" : "0"} sub={consult?.status} icon={CalendarClock} tone="blue" testid="stat-consultation" />}
        {has("competitor_benchmark") && <StatCard label="Competitor" value="Ready" icon={Swords} tone="gold" testid="stat-competitor" />}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="sx-card p-6 flex flex-col items-center justify-center">
          <ScoreDial score={data.avg_cx || null} />
        </div>

        <div className="sx-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-head font-semibold text-white">Recent Reports</h3>
            <Link to="/app/reports" className="text-sm text-[#E5A93C] hover:underline">View all</Link>
          </div>
          {reports.length === 0 ? <EmptyState title="No reports yet" body="Reports appear here once your audits are published." /> : (
            <div className="space-y-2">
              {reports.map((r) => (
                <Link key={r.id} to={`/app/reports/${r.project_id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#151B23] transition-colors" data-testid={`recent-report-${r.project_id}`}>
                  <div><div className="text-sm font-medium text-slate-100">{r.outlet_name}</div><div className="text-xs text-slate-500">{r.audit_id} · {formatDate(r.audit_date)}</div></div>
                  <div className="flex items-center gap-3"><ScoreBadge score={r.overall_cx_score} /><ArrowRight className="w-4 h-4 text-slate-600" /></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {criticalOutlet && (
        <div className="sx-card p-6 mt-6 border-red-500/30">
          <div className="flex items-center gap-2 mb-3"><ShieldAlert className="w-5 h-5 text-red-400" /><h3 className="font-head font-semibold text-white">Critical Outlet Alert</h3></div>
          <p className="text-sm text-slate-300"><span className="font-semibold text-red-400">{criticalOutlet.outlet}</span> scored {criticalOutlet.score}. Red flags: {criticalOutlet.red_flags.join(", ")}.</p>
        </div>
      )}

      <div className="sx-card p-6 mt-6">
        <h3 className="font-head font-semibold text-white mb-4">Audit Progress</h3>
        <div className="space-y-4">
          {data.projects.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-200">{p.project_id} · {p.package_snapshot.name}</span><StatusBadge status={p.status} /></div>
              <ProgressBar value={p.status === "report_published" ? 100 : p.status === "awaiting_review" ? 20 : 60} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
