import React from "react";
import { useClient } from "./ClientLayout";
import { PageHeader, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { Lightbulb } from "lucide-react";

const prioClass = { Immediate: "bg-red-500/10 text-red-400 border-red-500/30", "30-Day": "bg-amber-500/10 text-amber-300 border-amber-500/30", "90-Day": "bg-sky-500/10 text-sky-300 border-sky-500/30" };

export default function Recommendations() {
  const { data } = useClient();
  const recs = (data.reports || []).flatMap((r) => r.recommendations.map((x) => ({ ...x, outlet: r.outlet_name })));
  const groups = ["Immediate", "30-Day", "90-Day"];
  return (
    <div className="sx-fade-up">
      <PageHeader title="Recommendations" subtitle="Prioritised actions to lift your CX score." testid="client-recommendations" />
      {recs.length === 0 ? <EmptyState icon={Lightbulb} title="No recommendations yet" /> : (
        <div className="space-y-8">
          {groups.map((g) => {
            const items = recs.filter((r) => r.priority === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <div className="flex items-center gap-2 mb-3"><span className={`sx-chip ${prioClass[g]}`}>{g}</span><span className="text-xs text-slate-500">{items.length} action(s)</span></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map((r) => (
                    <div key={r.id} className="sx-card p-4" data-testid={`rec-${r.id}`}>
                      <h4 className="text-sm font-semibold text-slate-100">{r.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{r.action}</p>
                      <div className="flex justify-between text-xs text-slate-600 mt-3"><span>{r.responsible_area} · {r.outlet}</span><span>Target {formatDate(r.target_date)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
