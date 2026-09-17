import React from "react";
import { useClient } from "./ClientLayout";
import { PageHeader, ScoreBadge, ProgressBar, EmptyState } from "@/components/silentcx/primitives";
import { scoreRating } from "@/lib/format";
import { BarChart3, Trophy, TrendingDown } from "lucide-react";

export default function Benchmark() {
  const { data } = useClient();
  const report = (data.reports || []).find((r) => r.outlet_comparison);
  if (!report) return <EmptyState icon={BarChart3} title="Benchmarking not available" body="Available on the Performance package." />;
  return (
    <div className="sx-fade-up">
      <PageHeader title="Multi-Outlet Benchmark" subtitle="Compare performance across all outlets." testid="client-benchmark" />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="sx-card p-5"><div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider"><Trophy className="w-4 h-4" /> Best Outlet</div><div className="text-lg font-semibold text-white mt-2">{report.best_outlet.outlet}</div><div className="font-mono text-emerald-400">{report.best_outlet.score}</div></div>
        <div className="sx-card p-5"><div className="flex items-center gap-2 text-red-400 text-xs uppercase tracking-wider"><TrendingDown className="w-4 h-4" /> Lowest Outlet</div><div className="text-lg font-semibold text-white mt-2">{report.lowest_outlet.outlet}</div><div className="font-mono text-red-400">{report.lowest_outlet.score}</div></div>
        <div className="sx-card p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Score Gap</div><div className="font-mono text-3xl font-bold text-[#E5A93C] mt-2">{report.score_gap}</div></div>
      </div>
      <div className="sx-card p-6">
        <h3 className="font-head font-semibold text-white mb-4">Outlet Ranking</h3>
        <div className="space-y-3">
          {report.outlet_ranking.map((o) => { const r = scoreRating(o.score); return (
            <div key={o.outlet} className="flex items-center gap-3"><span className="font-mono text-sm text-slate-500 w-6">#{o.rank}</span><span className="text-sm text-slate-200 w-44 shrink-0 truncate">{o.outlet}</span><div className="flex-1"><ProgressBar value={o.score} hex={r.hex} /></div><ScoreBadge score={o.score} /></div>
          ); })}
        </div>
      </div>
    </div>
  );
}
