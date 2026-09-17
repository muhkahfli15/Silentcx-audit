import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, Loading, EmptyState, ScoreBadge, StatusBadge } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { FileBarChart, Search, Eye, TrendingUp } from "lucide-react";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    api.adminList("reports").then(setReports);
    api.adminList("projects").then(setProjects).catch(() => {});
  }, []);

  const projStatus = useMemo(() => Object.fromEntries(projects.map((p) => [p.project_id, p.status])), [projects]);

  const filtered = useMemo(() => {
    if (!reports) return [];
    const list = [...reports].sort((a, b) => new Date(b.audit_date) - new Date(a.audit_date));
    if (!q) return list;
    const s = q.toLowerCase();
    return list.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [reports, q]);

  if (!reports) return <Loading />;

  const avg = reports.length ? Math.round(reports.reduce((a, r) => a + (r.overall_cx_score || 0), 0) / reports.length) : 0;

  return (
    <div className="sx-fade-up">
      <PageHeader title="Audit Reports" subtitle="Delivered CX intelligence — scores, findings and downloadable reports. (Manage workflow in Audit Projects.)" testid="admin-reports"
        action={<div className="relative"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" /><input className="sx-input pl-9 w-64" placeholder="Search reports…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="reports-search" /></div>} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="sx-card p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Total Reports</div><div className="font-mono text-2xl font-bold text-slate-100 mt-2">{reports.length}</div></div>
        <div className="sx-card p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Published</div><div className="font-mono text-2xl font-bold text-emerald-400 mt-2">{reports.filter((r) => r.status === "published").length}</div></div>
        <div className="sx-card p-5 flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-slate-500">Avg CX Score</div><div className="font-mono text-2xl font-bold text-[#E5A93C] mt-2">{avg}</div></div><TrendingUp className="w-5 h-5 text-[#E5A93C]" /></div>
      </div>

      {filtered.length === 0 ? <EmptyState icon={FileBarChart} title="No reports found" /> : (
        <div className="sx-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#212836] bg-[#151B23]/60 text-slate-400 text-xs uppercase tracking-wider">
                {["Audit", "Outlet", "Client", "Package", "CX Score", "SOP", "Audited", "Report", ""].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-[#212836]/60 hover:bg-[#151B23]/40" data-testid={`report-row-${i}`}>
                    <td className="px-4 py-3 font-mono text-[#E5A93C]">{r.audit_id}</td>
                    <td className="px-4 py-3 text-slate-200">{r.outlet_name}</td>
                    <td className="px-4 py-3 text-slate-400">{r.client_company}</td>
                    <td className="px-4 py-3 text-slate-400">{r.package_name}</td>
                    <td className="px-4 py-3"><ScoreBadge score={r.overall_cx_score} /></td>
                    <td className="px-4 py-3 font-mono text-slate-300">{r.sop_compliance?.score != null ? `${r.sop_compliance.score}%` : "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(r.audit_date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={projStatus[r.project_id] === "report_published" || r.status === "published" ? "report_published" : "report_preparation"} /></td>
                    <td className="px-4 py-3"><Link to={`/admin/reports/${r.project_id}`} className="sx-chip text-slate-300 border-[#212836] hover:border-[#E5A93C]/40" data-testid={`report-view-${r.project_id}`}><Eye className="w-3.5 h-3.5" /> View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
