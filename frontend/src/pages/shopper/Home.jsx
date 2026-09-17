import React from "react";
import { Link } from "react-router-dom";
import { useShopper } from "./ShopperLayout";
import { StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatIDR } from "@/lib/format";
import { MapPin, ArrowRight, Wallet, AlertCircle } from "lucide-react";

export default function Home() {
  const { data } = useShopper();
  const { user, assignments, payments } = data;
  const verified = user.status === "verified";
  const upcoming = assignments.find((a) => a.status === "upcoming");
  const pending = assignments.filter((a) => a.status === "pending_submission");
  const revisions = assignments.filter((a) => a.status === "revision_required");
  const completed = assignments.filter((a) => a.status === "completed");

  return (
    <div className="sx-fade-up space-y-5" data-testid="shopper-home">
      <div>
        <h1 className="font-head text-xl font-bold text-white">Hi, {user.name.split(" ")[0]}</h1>
        <div className="mt-1"><StatusBadge status={user.status} /></div>
      </div>

      {!verified && (
        <div className="sx-card p-4 border-amber-500/30 flex gap-3"><AlertCircle className="w-5 h-5 text-amber-400 shrink-0" /><p className="text-sm text-slate-300">Your application is <b className="text-amber-400">{user.status.replace(/_/g, " ")}</b>. You'll receive assignments once verified by our team.</p></div>
      )}

      <div className="sx-card p-5 bg-gradient-to-br from-[#151B23] to-[#0D1117]">
        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2"><Wallet className="w-4 h-4 text-[#E5A93C]" /> Earnings</div>
        <div className="flex justify-between"><div><div className="text-xs text-slate-500">Paid</div><div className="font-mono text-lg font-bold text-emerald-400">{formatIDR(payments.paid)}</div></div><div className="text-right"><div className="text-xs text-slate-500">Pending</div><div className="font-mono text-lg font-bold text-amber-400">{formatIDR(payments.pending)}</div></div></div>
      </div>

      {upcoming && (
        <div>
          <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Upcoming Assignment</h2>
          <Link to={`/shopper/assignments/${upcoming.id}`} className="sx-card sx-card-hover p-4 block" data-testid="upcoming-assignment">
            <div className="flex justify-between items-start"><span className="font-mono text-xs text-[#E5A93C]">{upcoming.audit_id}</span><span className="font-mono text-sm text-[#E5A93C]">{formatIDR(upcoming.reward)}</span></div>
            <h3 className="font-head font-semibold text-white mt-1">{upcoming.outlet}</h3>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{upcoming.address}</div>
            <div className="text-xs text-slate-400 mt-2">{upcoming.visit_window}</div>
          </Link>
        </div>
      )}

      {revisions.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wider text-red-400 mb-2">Revision Required</h2>
          {revisions.map((a) => <Link key={a.id} to={`/shopper/assignments/${a.id}`} className="sx-card p-4 block border-red-500/30 mb-2"><div className="flex justify-between"><span className="text-sm text-slate-200">{a.outlet}</span><StatusBadge status={a.status} /></div><p className="text-xs text-slate-500 mt-1">{a.revision_note}</p></Link>)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pending" value={pending.length} />
        <Stat label="Completed" value={completed.length} />
        <Stat label="Total" value={assignments.length} />
      </div>

      <Link to="/shopper/assignments" className="sx-btn-secondary w-full" data-testid="view-all-assignments">All Assignments <ArrowRight className="w-4 h-4" /></Link>
    </div>
  );
}
const Stat = ({ label, value }) => (<div className="sx-card p-3 text-center"><div className="font-mono text-xl font-bold text-white">{value}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div></div>);
