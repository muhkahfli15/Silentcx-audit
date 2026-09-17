import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, StatusBadge, ScoreBadge, SeverityBadge, SectionCard, EmptyState } from "@/components/silentcx/primitives";
import { formatDate, formatIDR } from "@/lib/format";
import { evidenceUrl, evidenceViewUrl } from "@/lib/evidence";
import { ArrowLeft, Check, RotateCcw, X, FileText, Star, User } from "lucide-react";

function AnswerValue({ q }) {
  const v = q.answer;
  if (q.type === "evidence") return <span className="text-slate-500 text-sm">See evidence below</span>;
  if (v === undefined || v === null || v === "") return <span className="text-slate-600 text-sm italic">No answer</span>;
  if (q.type === "yes_no") return <span className={`sx-chip capitalize ${v === "yes" ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"}`}>{v}</span>;
  if (q.type === "scale_1_5") return <span className="font-mono text-[#E5A93C] text-lg">{v}<span className="text-slate-600 text-sm"> / 5</span></span>;
  if (q.type === "scale_0_10") return <span className="font-mono text-[#E5A93C] text-lg">{v}<span className="text-slate-600 text-sm"> / 10</span></span>;
  if (q.type === "numeric") return <span className="font-mono text-slate-100">{formatIDR(Number(v))}</span>;
  return <span className="text-slate-200 text-sm whitespace-pre-wrap">{String(v)}</span>;
}

function EvidenceThumbs({ items, testid }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3" data-testid={testid}>
      {items.map((e) => (
        <a key={e.id} href={evidenceViewUrl(e)} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-[#212836] bg-[#151B23] flex items-center justify-center" title={e.name}>
          {e.mime?.startsWith("image/") ? <img src={evidenceUrl(e)} alt={e.name} className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-slate-400" />}
        </a>
      ))}
    </div>
  );
}

export default function AdminSubmissionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const load = () => api.adminSubmissionDetail(id).then(setD).catch(() => setD(false));
  useEffect(() => { load(); }, [id]);
  if (d === null) return <Loading />;
  if (!d) return <EmptyState title="Submission not found" action={<Link to="/admin/qc" className="sx-btn-secondary">Back to QC</Link>} />;

  const { submission: s, shopper, questions, questionnaire_name, unmatched_evidence } = d;

  const act = async (action) => {
    const note = action === "revision" ? (prompt("Revision note for the shopper:") || "Please revise and resubmit.") : undefined;
    try { await api.submissionAction(s.id, { action, note }); toast.success(`Submission ${action}d`); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const categories = [...new Set(questions.map((q) => q.category))];
  const answered = questions.filter((q) => q.answer !== undefined && q.answer !== null && q.answer !== "").length;

  return (
    <div className="sx-fade-up" data-testid="admin-submission-detail">
      <Link to="/admin/qc" className="sx-btn-ghost mb-4 -ml-2" data-testid="submission-detail-back"><ArrowLeft className="w-4 h-4" /> QC & Submissions</Link>
      <PageHeader title={s.audit_id} subtitle={`${s.outlet} · ${questionnaire_name || "Audit"}`}
        action={<div className="flex items-center gap-2"><StatusBadge status={s.status} />{s.score != null && <ScoreBadge score={s.score} />}</div>} />

      {s.status === "under_review" && (
        <div className="sx-card p-4 mb-6 flex flex-wrap gap-2" data-testid="submission-detail-actions">
          <button onClick={() => act("approve")} className="sx-chip text-emerald-400 border-[#212836] hover:border-emerald-500/40" data-testid="detail-qc-approve"><Check className="w-3.5 h-3.5" /> Approve & Score</button>
          <button onClick={() => act("revision")} className="sx-chip text-amber-400 border-[#212836] hover:border-amber-500/40" data-testid="detail-qc-revision"><RotateCcw className="w-3.5 h-3.5" /> Request Revision</button>
          <button onClick={() => act("reject")} className="sx-chip text-red-400 border-[#212836] hover:border-red-500/40" data-testid="detail-qc-reject"><X className="w-3.5 h-3.5" /> Reject</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title={`Shopper Responses (${answered}/${questions.length} answered)`} subtitle="Exact input submitted by the mystery shopper.">
            {questions.length === 0 ? <p className="text-sm text-slate-500">This audit used a questionnaire with no questions.</p> : (
              <div className="space-y-5">
                {categories.map((cat) => (
                  <div key={cat}>
                    <h3 className="text-xs uppercase tracking-wider text-[#E5A93C] mb-2">{cat}</h3>
                    <div className="space-y-2">
                      {questions.filter((q) => q.category === cat).map((q) => (
                        <div key={q.id} className="p-4 rounded-lg bg-[#151B23]/50 border border-[#212836]" data-testid={`answer-${q.id}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="text-sm text-slate-200">{q.question}{q.required && <span className="text-red-400"> *</span>}</div>
                            <div className="shrink-0 text-right"><AnswerValue q={q} /></div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {q.weight > 0 && <span className="text-[10px] text-slate-600">weight {q.weight}</span>}
                            {q.severity && <SeverityBadge level={q.severity} />}
                          </div>
                          <EvidenceThumbs items={q.evidence} testid={`answer-evidence-${q.id}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {s.notes && <SectionCard title="Shopper Notes"><p className="text-sm text-slate-300 italic whitespace-pre-wrap">"{s.notes}"</p></SectionCard>}
          {unmatched_evidence?.length > 0 && <SectionCard title="Additional Evidence"><EvidenceThumbs items={unmatched_evidence} testid="unmatched-evidence" /></SectionCard>}
        </div>

        <div className="space-y-6">
          <SectionCard title="Submission Info">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={s.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-mono text-slate-100">{s.score ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transaction</span><span className="font-mono text-slate-100">{formatIDR(s.transaction_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Submitted</span><span className="text-slate-300">{formatDate(s.submitted_at)}</span></div>
              {s.qc_note && <div className="pt-2 border-t border-[#212836]"><div className="text-slate-500 mb-1">QC Note</div><div className="text-slate-300">{s.qc_note}</div></div>}
            </div>
          </SectionCard>
          {shopper && (
            <SectionCard title="Mystery Shopper">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#E5A93C]/15 text-[#E5A93C] flex items-center justify-center"><User className="w-5 h-5" /></div>
                <div><div className="text-sm text-slate-200">{shopper.name}</div><div className="text-xs text-slate-500">{shopper.city}</div></div>
              </div>
              <div className="text-xs text-slate-500">{shopper.email}</div>
              {shopper.rating != null && <div className="flex items-center gap-1 mt-2 text-sm text-[#E5A93C]"><Star className="w-4 h-4 fill-[#E5A93C]" /> {shopper.rating}</div>}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
