import React from "react";
import { Link } from "react-router-dom";
import { useClient } from "./ClientLayout";
import { PageHeader, ScoreBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { FileBarChart, ArrowRight } from "lucide-react";

export default function Reports() {
  const { data } = useClient();
  const reports = (data.reports || []).filter((r) => r.status === "published");
  return (
    <div className="sx-fade-up">
      <PageHeader title="Reports" subtitle="Interactive, management-ready audit reports." testid="client-reports" />
      {reports.length === 0 ? <EmptyState icon={FileBarChart} title="No published reports yet" body="Your reports appear here once the SilentCX team publishes them." /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {reports.map((r) => (
            <Link key={r.id} to={`/app/reports/${r.project_id}`} className="sx-card sx-card-hover p-6 flex flex-col" data-testid={`report-card-${r.project_id}`}>
              <div className="flex items-start justify-between">
                <div><span className="font-mono text-xs text-[#E5A93C]">{r.audit_id}</span><h3 className="font-head font-semibold text-white mt-1">{r.outlet_name}</h3><p className="text-xs text-slate-500">{r.package_name} · {formatDate(r.audit_date)}</p></div>
                <ScoreBadge score={r.overall_cx_score} />
              </div>
              <p className="text-sm text-slate-400 mt-4 line-clamp-2 flex-1">{r.executive_summary}</p>
              <div className="mt-4 text-sm text-[#E5A93C] flex items-center gap-1">Open report <ArrowRight className="w-4 h-4" /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
