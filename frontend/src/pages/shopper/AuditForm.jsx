import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { Loading, ProgressBar, EmptyState } from "@/components/silentcx/primitives";
import { EvidenceUploader } from "@/components/silentcx/EvidenceUploader";
import { ArrowLeft, Save, CheckCircle2, Loader2 } from "lucide-react";

export default function AuditForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const storeKey = `sx_audit_${id}`;
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState("");
  const [txn, setTxn] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.assignment(id).then(setD).catch(() => setD(false));
    const saved = localStorage.getItem(storeKey);
    if (saved) { try { const p = JSON.parse(saved); setAnswers(p.answers || {}); setNotes(p.notes || ""); setTxn(p.txn || ""); setEvidence((p.evidence || []).filter((e) => e && typeof e === "object")); } catch {} }
  }, [id]);

  // auto-save
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(storeKey, JSON.stringify({ answers, notes, txn, evidence })), 500);
    return () => clearTimeout(t);
  }, [answers, notes, txn, evidence]);

  const questions = d?.questionnaire?.questions || [];
  const scored = questions.filter((q) => ["yes_no", "scale_1_5", "scale_0_10"].includes(q.type));
  const answered = questions.filter((q) => q.required && (answers[q.id] !== undefined && answers[q.id] !== "") || (q.type === "numeric" && txn)).length;
  const requiredCount = questions.filter((q) => q.required).length;
  const progress = requiredCount ? Math.round((answered / requiredCount) * 100) : 0;

  const computeScore = () => {
    let total = 0, weightSum = 0;
    scored.forEach((q) => {
      const v = answers[q.id];
      if (v === undefined || v === "") return;
      let pct = 0;
      if (q.type === "yes_no") pct = v === "yes" ? 100 : 0;
      else if (q.type === "scale_1_5") pct = (Number(v) / 5) * 100;
      else if (q.type === "scale_0_10") pct = (Number(v) / 10) * 100;
      total += pct * q.weight; weightSum += q.weight;
    });
    return weightSum ? Math.round(total / weightSum) : 75;
  };

  const setA = (qid, v) => setAnswers((p) => ({ ...p, [qid]: v }));

  const submit = async () => {
    const missing = questions.filter((q) => q.required && q.type !== "numeric" && q.type !== "evidence" && (answers[q.id] === undefined || answers[q.id] === ""));
    if (missing.length) return toast.error(`Please answer: ${missing[0].question}`);
    if (!txn) return toast.error("Please enter the transaction amount.");
    const needEvidence = questions.filter((q) => q.required && (q.type === "evidence" || q.evidence_required) && !evidence.some((e) => (e.question_id || "") === q.id));
    if (needEvidence.length) return toast.error(`Evidence required: ${needEvidence[0].question}`);
    setSubmitting(true);
    try {
      await api.submitAudit(id, { answers, notes, transaction_amount: Number(txn), evidence, score: computeScore() });
      localStorage.removeItem(storeKey);
      toast.success("Audit submitted & locked for review!");
      nav("/shopper/submissions");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setSubmitting(false); }
  };

  if (d === null) return <Loading />;
  if (!d) return <EmptyState title="Assignment not found" />;

  const categories = [...new Set(questions.map((q) => q.category))];

  return (
    <div className="sx-fade-up pb-4" data-testid="audit-form">
      <Link to={`/shopper/assignments/${id}`} className="sx-btn-ghost mb-2 -ml-2"><ArrowLeft className="w-4 h-4" /> Back</Link>
      <h1 className="font-head text-xl font-bold text-white">{d.assignment.outlet}</h1>
      <p className="text-xs text-slate-500 mb-3">{d.assignment.audit_id} · Auto-saving <Save className="w-3 h-3 inline text-emerald-400" /></p>
      <div className="sticky top-14 z-10 bg-[#06080C]/95 py-2 -mx-4 px-4 mb-4">
        <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Progress</span><span className="font-mono text-[#E5A93C]">{progress}%</span></div>
        <ProgressBar value={progress} />
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-5">
          <h2 className="text-xs uppercase tracking-wider text-[#E5A93C] mb-2">{cat}</h2>
          <div className="space-y-3">
            {questions.filter((q) => q.category === cat).map((q) => (
              <div key={q.id} className="sx-card p-4" data-testid={`question-${q.id}`}>
                <label className="text-sm text-slate-200">{q.question}{q.required && <span className="text-red-400"> *</span>}</label>
                <div className="mt-2">
                  {q.type === "yes_no" && (
                    <div className="flex gap-2">{["yes", "no"].map((o) => <button key={o} onClick={() => setA(q.id, o)} className={`sx-chip capitalize ${answers[q.id] === o ? "bg-[#E5A93C] text-[#06080C] border-transparent" : "border-[#212836] text-slate-400"}`} data-testid={`q-${q.id}-${o}`}>{o}</button>)}</div>
                  )}
                  {q.type === "scale_1_5" && <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setA(q.id, n)} className={`w-9 h-9 rounded-lg font-mono text-sm ${Number(answers[q.id]) === n ? "bg-[#E5A93C] text-[#06080C]" : "bg-[#151B23] text-slate-400"}`} data-testid={`q-${q.id}-${n}`}>{n}</button>)}</div>}
                  {q.type === "scale_0_10" && <input type="range" min="0" max="10" value={answers[q.id] ?? 5} onChange={(e) => setA(q.id, e.target.value)} className="w-full accent-[#E5A93C]" data-testid={`q-${q.id}-range`} />}
                  {q.type === "scale_0_10" && <div className="text-center font-mono text-[#E5A93C] mt-1">{answers[q.id] ?? 5}</div>}
                  {q.type === "text" && <textarea className="sx-input" rows="3" value={answers[q.id] || ""} onChange={(e) => setA(q.id, e.target.value)} data-testid={`q-${q.id}-text`} />}
                  {q.type === "numeric" && <input className="sx-input" type="number" value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="IDR" data-testid={`q-${q.id}-numeric`} />}
                  {q.type === "evidence" && <EvidenceUploader assignmentId={id} questionId={q.id} items={evidence} onChange={setEvidence} testid={`q-${q.id}-upload`} />}
                  {q.type !== "evidence" && q.evidence_required && (
                    <div className="mt-3"><EvidenceUploader assignmentId={id} questionId={q.id} items={evidence} onChange={setEvidence} label="Photo evidence required" testid={`q-${q.id}-upload`} /></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-4"><label className="sx-label">Additional Notes</label><textarea className="sx-input" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="audit-notes" /></div>

      <button className="sx-btn-primary w-full" onClick={submit} disabled={submitting} data-testid="shopper-submit-audit-button">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Submit Audit</>}
      </button>
    </div>
  );
}
