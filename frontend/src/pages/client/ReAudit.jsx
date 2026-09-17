import React from "react";
import { useClient } from "./ClientLayout";
import { PageHeader, EmptyState } from "@/components/silentcx/primitives";
import { RefreshCw, TrendingUp } from "lucide-react";

export default function ReAudit() {
  const { data } = useClient();
  const report = (data.reports || []).find((r) => r.re_audit);
  if (!report) return <EmptyState icon={RefreshCw} title="Re-Audit comparison not available" body="Request a Re-Audit to compare against your initial audit." />;
  const ra = report.re_audit;
  const Metric = ({ label, value, gold }) => (<div className="sx-card p-5 text-center"><div className="text-xs uppercase text-slate-500 tracking-wider">{label}</div><div className={`font-mono text-3xl font-bold mt-1 ${gold ? "text-[#E5A93C]" : "text-slate-100"}`}>{value}</div></div>);
  return (
    <div className="sx-fade-up">
      <PageHeader title="Re-Audit Comparison" subtitle={`${report.outlet_name} · Initial vs Re-Audit`} testid="client-reaudit" />
      <div className="sx-card p-6 mb-6 flex items-center justify-center gap-6 bg-gradient-to-br from-[#151B23] to-[#0D1117]">
        <span className="font-mono text-4xl font-bold text-slate-400">{ra.initial_score}</span>
        <div className="flex flex-col items-center text-emerald-400"><TrendingUp className="w-6 h-6" /><span className="font-mono font-bold">+{ra.delta}</span></div>
        <span className="font-mono text-5xl font-bold text-[#E5A93C]">{ra.reaudit_score}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Metric label="Initial Score" value={ra.initial_score} />
        <Metric label="Re-Audit Score" value={ra.reaudit_score} gold />
        <Metric label="Resolved" value={ra.resolved_findings} />
        <Metric label="New Findings" value={ra.new_findings} />
      </div>
      <div className="sx-card p-6">
        <h3 className="font-head font-semibold text-white mb-4">Findings Progress</h3>
        <div className="space-y-2">
          {ra.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50 text-sm"><span className="text-slate-300">{it.finding}</span><span className="text-xs text-slate-500 capitalize">{it.before} → <span className={it.after === "resolved" ? "text-emerald-400" : "text-amber-400"}>{it.after}</span></span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
