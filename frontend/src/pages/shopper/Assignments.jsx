import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useShopper } from "./ShopperLayout";
import { StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatIDR } from "@/lib/format";
import { MapPin, ArrowRight, ClipboardList } from "lucide-react";

export default function Assignments() {
  const { data } = useShopper();
  const [tab, setTab] = useState("active");
  const active = data.assignments.filter((a) => ["upcoming", "pending_submission", "revision_required", "scheduled"].includes(a.status));
  const done = data.assignments.filter((a) => ["completed", "submitted"].includes(a.status));
  const list = tab === "active" ? active : done;
  return (
    <div className="sx-fade-up" data-testid="shopper-assignments">
      <h1 className="font-head text-xl font-bold text-white mb-4">Assignments</h1>
      <div className="flex gap-2 mb-4">
        {[["active", "Active"], ["done", "Completed"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`sx-chip ${tab === k ? "bg-[#E5A93C] text-[#06080C] border-transparent" : "border-[#212836] text-slate-400"}`} data-testid={`assignments-tab-${k}`}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? <EmptyState icon={ClipboardList} title="No assignments here" /> : (
        <div className="space-y-3">
          {list.map((a) => (
            <Link key={a.id} to={`/shopper/assignments/${a.id}`} className="sx-card sx-card-hover p-4 block" data-testid={`assignment-${a.id}`}>
              <div className="flex justify-between items-start"><span className="font-mono text-xs text-[#E5A93C]">{a.audit_id}</span><StatusBadge status={a.status} /></div>
              <h3 className="font-head font-semibold text-white mt-1">{a.outlet}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{a.address}</div>
              <div className="flex justify-between items-center mt-2"><span className="text-xs text-slate-400">{a.visit_window}</span><span className="font-mono text-sm text-[#E5A93C] flex items-center gap-1">{formatIDR(a.reward)} <ArrowRight className="w-3.5 h-3.5" /></span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
