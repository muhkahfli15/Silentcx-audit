import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { api, formatApiError } from "@/lib/api";
import { SectionCard } from "@/components/silentcx/primitives";
import { QuestionRow } from "./QuestionRow";
import { Plus, Save, Loader2 } from "lucide-react";

const SERVICE_TYPES = ["Mystery Shopping", "CX Audit", "SOP Compliance", "Competitor Benchmark"];
const newId = () => `q_${Math.random().toString(36).slice(2, 8)}`;

export function QuestionnaireEditor({ questionnaire, categories, packages, onSaved }) {
  const [meta, setMeta] = useState({ name: questionnaire.name, service_type: questionnaire.service_type || "Mystery Shopping", industry: questionnaire.industry || "", package_keys: questionnaire.package_keys || [], active: !!questionnaire.active });
  const [questions, setQuestions] = useState((questionnaire.questions || []).map((q) => ({ ...q })));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const catNames = useMemo(() => [...new Set([...categories.map((c) => c.name), ...questions.map((q) => q.category).filter(Boolean), "General"])], [categories, questions]);
  const totalWeight = questions.filter((q) => ["yes_no", "scale_1_5", "scale_0_10"].includes(q.type)).reduce((s, q) => s + Number(q.weight || 0), 0);

  const touch = (fn) => { fn(); setDirty(true); };
  const setM = (k, v) => touch(() => setMeta((m) => ({ ...m, [k]: v })));
  const update = (id, patch) => touch(() => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q))));
  const remove = (id) => touch(() => setQuestions((qs) => qs.filter((q) => q.id !== id)));
  const add = (category) => touch(() => setQuestions((qs) => [...qs, { id: newId(), question: "", category: category || catNames[0], type: "yes_no", weight: 10, required: true, evidence_required: false, severity: "medium" }]));
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    touch(() => setQuestions((qs) => arrayMove(qs, qs.findIndex((q) => q.id === active.id), qs.findIndex((q) => q.id === over.id))));
  };
  const togglePkg = (k) => setM("package_keys", meta.package_keys.includes(k) ? meta.package_keys.filter((x) => x !== k) : [...meta.package_keys, k]);

  const save = async () => {
    if (!meta.name.trim()) return toast.error("Name is required");
    if (questions.some((q) => !q.question.trim())) return toast.error("Every question needs text");
    setSaving(true);
    try { const q = await api.updateQuestionnaire(questionnaire.id, { ...meta, questions }); toast.success("Questionnaire saved"); setDirty(false); onSaved(q); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5" data-testid="questionnaire-editor">
      <SectionCard title="Details" right={
        <button className="sx-btn-primary text-xs py-2" onClick={save} disabled={saving || !dirty} data-testid="save-questionnaire-button">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {dirty ? "Save changes" : "Saved"}
        </button>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="sx-label">Name</label><input className="sx-input" value={meta.name} onChange={(e) => setM("name", e.target.value)} data-testid="questionnaire-name-input" /></div>
          <div><label className="sx-label">Service type</label>
            <select className="sx-input" value={meta.service_type} onChange={(e) => setM("service_type", e.target.value)} data-testid="questionnaire-service-select">{SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="sx-label">Industry (auto-match keyword)</label><input className="sx-input" placeholder="e.g. F&B, Retail, Clinic" value={meta.industry} onChange={(e) => setM("industry", e.target.value)} data-testid="questionnaire-industry-input" /></div>
          <div><label className="sx-label">Linked packages</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {packages.map((p) => <button key={p.key} type="button" onClick={() => togglePkg(p.key)} className={`sx-chip capitalize ${meta.package_keys.includes(p.key) ? "bg-[#E5A93C] text-[#06080C] border-transparent" : "border-[#212836] text-slate-400"}`} data-testid={`pkg-toggle-${p.key}`}>{p.key}</button>)}
            </div></div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={meta.active} onChange={(e) => setM("active", e.target.checked)} className="accent-[#E5A93C]" data-testid="questionnaire-active-toggle" /> Active (available for assignments)</label>
        </div>
      </SectionCard>

      <SectionCard title={`Questions (${questions.length})`} subtitle="Drag the handle to reorder. Order is how shoppers see them."
        right={<span className={`font-mono text-xs ${totalWeight === 100 ? "text-emerald-400" : "text-amber-400"}`} data-testid="total-weight">Weight {totalWeight}/100</span>}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2" data-testid="question-list">
              {questions.map((q, i) => <QuestionRow key={q.id} index={i} q={q} categories={catNames} onChange={(patch) => update(q.id, patch)} onRemove={() => remove(q.id)} />)}
            </div>
          </SortableContext>
        </DndContext>
        {questions.length === 0 && <div className="text-sm text-slate-500 text-center py-6">No questions yet — add your first one.</div>}
        <button className="sx-btn-secondary w-full mt-3" onClick={() => add()} data-testid="add-question-button"><Plus className="w-4 h-4" /> Add question</button>
      </SectionCard>
    </div>
  );
}
