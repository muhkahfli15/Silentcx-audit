import React from "react";
import { useShopper } from "./ShopperLayout";
import { formatIDR } from "@/lib/format";
import { StatusBadge as SB } from "@/components/silentcx/primitives";
import { Wallet } from "lucide-react";

export default function Payments() {
  const { data } = useShopper();
  const { payments, assignments } = data;
  return (
    <div className="sx-fade-up" data-testid="shopper-payments">
      <h1 className="font-head text-xl font-bold text-white mb-4">Payments</h1>
      <div className="sx-card p-5 mb-4 bg-gradient-to-br from-[#151B23] to-[#0D1117]">
        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-3"><Wallet className="w-4 h-4 text-[#E5A93C]" /> Wallet</div>
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-slate-500">Paid</div><div className="font-mono text-2xl font-bold text-emerald-400">{formatIDR(payments.paid)}</div></div>
          <div><div className="text-xs text-slate-500">Pending</div><div className="font-mono text-2xl font-bold text-amber-400">{formatIDR(payments.pending)}</div></div>
        </div>
      </div>
      <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Payment History</h2>
      <div className="space-y-2">
        {assignments.map((a) => (
          <div key={a.id} className="sx-card p-3 flex justify-between items-center">
            <div><div className="text-sm text-slate-200">{a.outlet}</div><div className="text-xs text-slate-500">{a.audit_id}</div></div>
            <div className="text-right"><div className="font-mono text-sm text-[#E5A93C]">{formatIDR(a.reward)}</div><SB status={a.status === "completed" ? "paid" : "pending"} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
