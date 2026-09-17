import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Loading, StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatIDR } from "@/lib/format";
import { MapPin, Navigation, Clock, ShoppingBag, Wallet, FileText, ArrowLeft, ClipboardEdit } from "lucide-react";

export default function AssignmentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  useEffect(() => { api.assignment(id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === null) return <Loading />;
  if (!d) return <EmptyState title="Assignment not found" action={<Link to="/shopper/assignments" className="sx-btn-secondary">Back</Link>} />;
  const a = d.assignment;
  const canSubmit = ["upcoming", "pending_submission", "revision_required", "scheduled"].includes(a.status);

  const Row = ({ icon: Icon, label, value }) => (<div className="flex gap-3 py-2.5 border-b border-[#212836]/60 last:border-0"><Icon className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" /><div><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="text-sm text-slate-200">{value}</div></div></div>);

  return (
    <div className="sx-fade-up" data-testid="assignment-detail">
      <Link to="/shopper/assignments" className="sx-btn-ghost mb-3 -ml-2"><ArrowLeft className="w-4 h-4" /> Back</Link>
      <div className="flex justify-between items-start mb-3"><div><span className="font-mono text-xs text-[#E5A93C]">{a.audit_id}</span><h1 className="font-head text-xl font-bold text-white">{a.outlet}</h1></div><StatusBadge status={a.status} /></div>

      {a.status === "revision_required" && a.revision_note && (
        <div className="sx-card p-3 border-red-500/30 mb-4 text-sm text-slate-300"><b className="text-red-400">Revision:</b> {a.revision_note}</div>
      )}

      <div className="sx-card p-4 mb-4">
        <Row icon={MapPin} label="Address" value={a.address} />
        <Row icon={Clock} label="Visit Window" value={a.visit_window} />
        <Row icon={FileText} label="Scenario" value={a.scenario} />
        <Row icon={ShoppingBag} label="Required Purchase" value={a.required_purchase} />
        <Row icon={Wallet} label="Max Reimbursement" value={formatIDR(a.max_reimbursement)} />
      </div>

      <div className="sx-card p-4 mb-4"><div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Instructions</div><p className="text-sm text-slate-300">{a.instructions}</p></div>

      <a href={a.maps_link} target="_blank" rel="noreferrer" className="sx-btn-secondary w-full mb-3" data-testid="maps-link"><Navigation className="w-4 h-4" /> Open in Maps</a>
      {canSubmit && <button className="sx-btn-primary w-full" onClick={() => nav(`/shopper/assignments/${id}/audit`)} data-testid="start-audit-button"><ClipboardEdit className="w-4 h-4" /> {a.status === "revision_required" ? "Revise & Resubmit" : "Start Audit"}</button>}
    </div>
  );
}
