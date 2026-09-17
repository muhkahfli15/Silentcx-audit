import React from "react";
import { useShopper } from "./ShopperLayout";
import { StatusBadge, ScoreBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { Send } from "lucide-react";

export default function Submissions() {
  const { data } = useShopper();
  const subs = data.submissions || [];
  return (
    <div className="sx-fade-up" data-testid="shopper-submissions">
      <h1 className="font-head text-xl font-bold text-white mb-4">Submissions</h1>
      {subs.length === 0 ? <EmptyState icon={Send} title="No submissions yet" /> : (
        <div className="space-y-3">
          {subs.map((s) => (
            <div key={s.id} className="sx-card p-4" data-testid={`submission-${s.id}`}>
              <div className="flex justify-between items-start"><div><span className="font-mono text-xs text-[#E5A93C]">{s.audit_id}</span><h3 className="text-sm font-semibold text-slate-100">{s.outlet}</h3></div><StatusBadge status={s.status} /></div>
              <div className="flex justify-between items-center mt-2 text-xs text-slate-500"><span>Submitted {formatDate(s.submitted_at)}</span>{s.score && <ScoreBadge score={s.score} />}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
