import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useClient } from "./ClientLayout";
import { PageHeader, StatusBadge, ScoreBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { ClipboardList, ArrowRight } from "lucide-react";

export default function Audits() {
  const { data } = useClient();
  const reports = data.reports || [];
  const [status, setStatus] = useState("all");
  const rows = data.projects.map((p) => {
    const rep = reports.find((r) => r.project_id === p.project_id);
    return { p, rep };
  }).filter(({ p }) => status === "all" || p.status === status);

  return (
    <div className="sx-fade-up">
      <PageHeader title="Audits" subtitle="Track every audit project and its status." testid="client-audits"
        action={
          <select className="sx-input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} data-testid="audits-status-filter">
            <option value="all">All statuses</option>
            <option value="report_published">Published</option>
            <option value="awaiting_review">Awaiting Review</option>
          </select>
        } />
      {rows.length === 0 ? <EmptyState icon={ClipboardList} title="No audits found" /> : (
        <div className="sx-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#212836] bg-[#151B23]/60 text-slate-400 text-xs uppercase tracking-wider">
                {["Audit / Project", "Outlet", "Package", "Status", "CX Score", "Date", ""].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map(({ p, rep }) => (
                  <tr key={p.id} className="border-b border-[#212836]/60 hover:bg-[#151B23]/40" data-testid={`audit-row-${p.project_id}`}>
                    <td className="px-4 py-3"><span className="font-mono text-[#E5A93C]">{rep?.audit_id || p.project_id}</span></td>
                    <td className="px-4 py-3 text-slate-200">{rep?.outlet_name || `${p.outlets.length} outlet(s)`}</td>
                    <td className="px-4 py-3 text-slate-400">{p.package_snapshot.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">{rep ? <ScoreBadge score={rep.overall_cx_score} /> : <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(rep?.audit_date || p.created_at)}</td>
                    <td className="px-4 py-3 text-right"><Link to={`/app/audits/${p.project_id}`} className="sx-btn-ghost" data-testid={`view-audit-${p.project_id}`}>View <ArrowRight className="w-4 h-4" /></Link></td>
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
