import React from "react";
import { useClient } from "./ClientLayout";
import { PageHeader, ProgressBar, EmptyState } from "@/components/silentcx/primitives";
import { Swords, CheckCircle2, XCircle } from "lucide-react";

export default function Competitor() {
  const { data } = useClient();
  const report = (data.reports || []).find((r) => r.competitor_benchmark);
  if (!report) return <EmptyState icon={Swords} title="Competitor benchmark not available" body="Add the Competitor Benchmark module to unlock." />;
  const cb = report.competitor_benchmark;
  return (
    <div className="sx-fade-up">
      <PageHeader title="Competitor Benchmark" subtitle={`${report.outlet_name} vs ${cb.competitor_name}`} testid="client-competitor" />
      <div className="sx-card p-6 mb-6">
        <div className="space-y-3">
          {cb.metrics.map((m) => (
            <div key={m.metric} className="flex items-center gap-3">
              <span className="text-sm text-slate-300 w-40 shrink-0 truncate">{m.metric}</span>
              <div className="flex-1 flex gap-2 items-center">
                <div className="flex-1"><ProgressBar value={m.client} hex="#E5A93C" /></div><span className="font-mono text-xs text-[#E5A93C] w-8">{m.client}</span>
                <div className="flex-1"><ProgressBar value={m.competitor} hex="#8B5CF6" /></div><span className="font-mono text-xs text-purple-400 w-8">{m.competitor}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs"><span className="text-[#E5A93C]">■ {report.outlet_name}</span><span className="text-purple-400">■ {cb.competitor_name}</span></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sx-card p-6"><h3 className="font-head font-semibold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Strengths</h3><ul className="space-y-2">{cb.strengths.map((s) => <li key={s} className="text-sm text-slate-300">• {s}</li>)}</ul></div>
        <div className="sx-card p-6"><h3 className="font-head font-semibold text-red-400 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" /> Weaknesses</h3><ul className="space-y-2">{cb.weaknesses.map((s) => <li key={s} className="text-sm text-slate-300">• {s}</li>)}</ul></div>
      </div>
    </div>
  );
}
