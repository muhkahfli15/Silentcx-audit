import React, { useState } from "react";
import { toast } from "sonner";
import { useClient } from "./ClientLayout";
import { api } from "@/lib/api";
import { PageHeader, StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatIDR, formatDate } from "@/lib/format";
import { Receipt } from "lucide-react";

export default function Billing() {
  const { data, reload } = useClient();
  const [invoices, setInvoices] = useState(data.invoices || []);
  const [busy, setBusy] = useState(null);

  const pay = async (inv) => {
    setBusy(inv.invoice_id);
    try { await api.payInvoice(inv.invoice_id); setInvoices((p) => p.map((x) => x.id === inv.id ? { ...x, status: "paid" } : x)); toast.success("Invoice marked as paid"); reload(); }
    catch { toast.error("Payment failed"); } finally { setBusy(null); }
  };

  return (
    <div className="sx-fade-up">
      <PageHeader title="Billing" subtitle="Invoices for your audit projects." testid="client-billing" />
      {invoices.length === 0 ? <EmptyState icon={Receipt} title="No invoices" /> : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <div key={inv.id} className="sx-card p-6" data-testid={`invoice-${inv.invoice_id}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                <div><span className="font-mono text-[#E5A93C]">{inv.invoice_id}</span><div className="text-sm text-slate-400 mt-0.5">{inv.package} · {inv.project_id} · {formatDate(inv.created_at)}</div></div>
                <div className="flex items-center gap-3"><StatusBadge status={inv.status} />{inv.status !== "paid" && <button className="sx-btn-primary" onClick={() => pay(inv)} disabled={busy === inv.invoice_id} data-testid={`pay-${inv.invoice_id}`}>{busy === inv.invoice_id ? "Processing…" : "Pay Now"}</button>}</div>
              </div>
              <div className="border-t border-[#212836] pt-4 space-y-2">
                {inv.items.map((it, i) => <div key={i} className="flex justify-between text-sm"><span className="text-slate-300">{it.label}</span><span className="font-mono text-slate-200">{formatIDR(it.amount)}</span></div>)}
                {inv.reimbursement > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Excess Reimbursement</span><span className="font-mono text-slate-300">{formatIDR(inv.reimbursement)}</span></div>}
                {inv.discount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-400">Discount</span><span className="font-mono text-emerald-400">-{formatIDR(inv.discount)}</span></div>}
                <div className="flex justify-between border-t border-[#212836] pt-2 mt-2"><span className="font-semibold text-white">Total</span><span className="font-mono text-lg font-bold text-[#E5A93C]">{formatIDR(inv.total)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
