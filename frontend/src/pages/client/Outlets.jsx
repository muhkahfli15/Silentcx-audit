import React from "react";
import { Link } from "react-router-dom";
import { useClient } from "./ClientLayout";
import { PageHeader, ScoreBadge, StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { Store, ArrowRight } from "lucide-react";

export default function Outlets() {
  const { data } = useClient();
  const outlets = data.outlets || [];
  return (
    <div className="sx-fade-up">
      <PageHeader title="Outlets" subtitle="Every location under audit." testid="client-outlets" />
      {outlets.length === 0 ? <EmptyState icon={Store} title="No outlets yet" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((o) => (
            <Link key={o.id} to={`/app/outlets/${o.id}`} className="sx-card sx-card-hover p-5" data-testid={`outlet-card-${o.id}`}>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#E5A93C]/10 text-[#E5A93C] flex items-center justify-center"><Store className="w-4 h-4" /></div>
                {o.status && <StatusBadge status={o.status} />}
              </div>
              <h3 className="font-head font-semibold text-white mt-3">{o.name}</h3>
              <p className="text-xs text-slate-500">{o.city}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-slate-500">CX {o.latest_cx ? <span className="font-mono text-slate-200">{o.latest_cx}</span> : "—"} · SOP {o.latest_sop ? <span className="font-mono text-slate-200">{o.latest_sop}%</span> : "—"}</div>
                {o.latest_cx && <ScoreBadge score={o.latest_cx} />}
              </div>
              <div className="text-xs text-slate-600 mt-3 flex items-center justify-between">Last audit {formatDate(o.last_audit)}<ArrowRight className="w-3.5 h-3.5" /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
