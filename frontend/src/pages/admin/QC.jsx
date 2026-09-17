import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, StatusBadge, ScoreBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate, formatIDR } from "@/lib/format";
import { evidenceUrl, evidenceViewUrl } from "@/lib/evidence";
import { ClipboardCheck, Check, RotateCcw, X, FileText } from "lucide-react";

export default function QC() {
  const [subs, setSubs] = useState(null);
  const load = () => api.adminList("submissions").then(setSubs);
  useEffect(() => { load(); }, []);
  if (!subs) return <Loading />;

  const act = async (id, action) => {
    const note = action === "revision" ? prompt("Revision note for the shopper:") || "Please revise and resubmit." : undefined;
    try { await api.submissionAction(id, { action, note }); toast.success(`Submission ${action}d`); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const pending = subs.filter((s) => s.status === "under_review");
  const rest = subs.filter((s) => s.status !== "under_review");

  const Card = ({ s, showActions }) => (
    <div className="sx-card p-5" data-testid={`submission-${s.id}`}>
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><span className="font-mono text-[#E5A93C] text-sm">{s.audit_id}</span><StatusBadge status={s.status} />{s.score && <ScoreBadge score={s.score} />}</div>
          <p className="text-sm text-slate-200 mt-1">{s.outlet}</p>
          <p className="text-xs text-slate-500 mt-0.5">Submitted {formatDate(s.submitted_at)} · Txn {formatIDR(s.transaction_amount)}</p>
          {Array.isArray(s.evidence) && s.evidence.filter((e) => e && typeof e === "object").length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" data-testid={`evidence-list-${s.id}`}>
              {s.evidence.filter((e) => e && typeof e === "object").map((e) => (
                <a key={e.id} href={evidenceViewUrl(e)} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-[#212836] bg-[#151B23] flex items-center justify-center" title={e.name}>
                  {e.mime?.startsWith("image/") ? <img src={evidenceUrl(e)} alt={e.name} className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-slate-400" />}
                </a>
              ))}
            </div>
          )}
          {s.notes && <p className="text-xs text-slate-400 mt-2 italic">“{s.notes}”</p>}
        </div>
        {showActions && (
          <div className="flex gap-2 items-start">
            <button onClick={() => act(s.id, "approve")} className="sx-chip text-emerald-400 border-[#212836] hover:border-emerald-500/40" data-testid={`qc-approve-${s.id}`}><Check className="w-3.5 h-3.5" /> Approve & Score</button>
            <button onClick={() => act(s.id, "revision")} className="sx-chip text-amber-400 border-[#212836] hover:border-amber-500/40" data-testid={`qc-revision-${s.id}`}><RotateCcw className="w-3.5 h-3.5" /> Revision</button>
            <button onClick={() => act(s.id, "reject")} className="sx-chip text-red-400 border-[#212836] hover:border-red-500/40" data-testid={`qc-reject-${s.id}`}><X className="w-3.5 h-3.5" /> Reject</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="sx-fade-up">
      <PageHeader title="QC & Submissions" subtitle="Review shopper submissions before publishing reports." testid="admin-qc" />
      <h2 className="text-xs uppercase tracking-wider text-[#E5A93C] mb-2">Waiting for QC ({pending.length})</h2>
      {pending.length === 0 ? <EmptyState icon={ClipboardCheck} title="Nothing waiting for QC" /> : <div className="space-y-3 mb-8">{pending.map((s) => <Card key={s.id} s={s} showActions />)}</div>}
      {rest.length > 0 && <><h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2 mt-6">Processed</h2><div className="space-y-3">{rest.map((s) => <Card key={s.id} s={s} />)}</div></>}
    </div>
  );
}
