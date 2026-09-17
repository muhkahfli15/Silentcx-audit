import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, Loading, ScoreBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { ArrowRight, TrendingUp } from "lucide-react";

export default function OutletDetail() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  useEffect(() => { api.outlet(id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === null) return <Loading />;
  if (!d) return <EmptyState title="Outlet not found" action={<Link to="/app/outlets" className="sx-btn-secondary">Back</Link>} />;
  const { outlet, reports } = d;
  return (
    <div className="sx-fade-up">
      <PageHeader title={outlet.name} subtitle={`${outlet.city} · Last audit ${formatDate(outlet.last_audit)}`} testid="outlet-detail"
        action={outlet.latest_cx && <ScoreBadge score={outlet.latest_cx} />} />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="sx-card p-5"><div className="text-xs uppercase text-slate-500 tracking-wider">Latest CX</div><div className="font-mono text-3xl font-bold text-[#E5A93C] mt-2">{outlet.latest_cx ?? "—"}</div></div>
        <div className="sx-card p-5"><div className="text-xs uppercase text-slate-500 tracking-wider">Latest SOP</div><div className="font-mono text-3xl font-bold text-slate-100 mt-2">{outlet.latest_sop ? `${outlet.latest_sop}%` : "—"}</div></div>
        <div className="sx-card p-5"><div className="text-xs uppercase text-slate-500 tracking-wider">Audits</div><div className="font-mono text-3xl font-bold text-slate-100 mt-2">{reports.length}</div></div>
      </div>
      <div className="sx-card p-6">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-[#E5A93C]" /><h3 className="font-head font-semibold text-white">Audit History</h3></div>
        {reports.length === 0 ? <EmptyState title="No audit history" /> : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Link key={r.id} to={`/app/reports/${r.project_id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#151B23]">
                <div><div className="text-sm text-slate-100">{r.audit_id}</div><div className="text-xs text-slate-500">{formatDate(r.audit_date)}</div></div>
                <div className="flex items-center gap-3"><ScoreBadge score={r.overall_cx_score} /><ArrowRight className="w-4 h-4 text-slate-600" /></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
