import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown, ChevronUp, Camera } from "lucide-react";

export const TYPES = [
  ["yes_no", "Yes / No"], ["scale_1_5", "Scale 1–5"], ["scale_0_10", "Scale 0–10"],
  ["text", "Free text"], ["numeric", "Number (IDR)"], ["evidence", "Photo / Receipt"],
];
const SCORED = ["yes_no", "scale_1_5", "scale_0_10"];

export function QuestionRow({ q, index, categories, onChange, onRemove }) {
  const [open, setOpen] = useState(!q.question);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`sx-card ${isDragging ? "border-[#E5A93C]/60 shadow-lg" : ""}`} data-testid={`qrow-${q.id}`}>
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="text-slate-600 hover:text-[#E5A93C] cursor-grab active:cursor-grabbing touch-none p-1" data-testid={`drag-handle-${q.id}`} aria-label="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
        <span className="font-mono text-xs text-slate-600 w-6">{index + 1}</span>
        <input className="sx-input flex-1 py-2 text-sm" placeholder="Question text…" value={q.question} onChange={(e) => onChange({ question: e.target.value })} data-testid={`qtext-${q.id}`} />
        <span className="hidden sm:inline text-[10px] px-2 py-1 rounded bg-[#151B23] text-slate-400 truncate max-w-[140px]">{q.category}</span>
        <span className="hidden md:inline text-[10px] px-2 py-1 rounded bg-[#E5A93C]/10 text-[#E5A93C]">{TYPES.find((t) => t[0] === q.type)?.[1]}</span>
        {q.evidence_required && <Camera className="w-3.5 h-3.5 text-slate-400" title="Evidence required" />}
        <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-slate-200 p-1" data-testid={`qexpand-${q.id}`}>{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 p-1" data-testid={`qremove-${q.id}`}><Trash2 className="w-4 h-4" /></button>
      </div>
      {open && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 pb-4 pt-1 border-t border-[#212836]/60">
          <div><label className="sx-label">Category</label>
            <input list={`cats-${q.id}`} className="sx-input py-2 text-sm" value={q.category} onChange={(e) => onChange({ category: e.target.value })} data-testid={`qcat-${q.id}`} />
            <datalist id={`cats-${q.id}`}>{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
          <div><label className="sx-label">Type</label>
            <select className="sx-input py-2 text-sm" value={q.type} onChange={(e) => onChange({ type: e.target.value, evidence_required: e.target.value === "evidence" ? true : q.evidence_required })} data-testid={`qtype-${q.id}`}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="sx-label">Weight {SCORED.includes(q.type) ? "" : "(n/a)"}</label>
            <input type="number" min="0" max="100" disabled={!SCORED.includes(q.type)} className="sx-input py-2 text-sm disabled:opacity-40" value={q.weight ?? 0} onChange={(e) => onChange({ weight: Number(e.target.value) })} data-testid={`qweight-${q.id}`} /></div>
          <div><label className="sx-label">Severity if failed</label>
            <select className="sx-input py-2 text-sm" value={q.severity || "medium"} onChange={(e) => onChange({ severity: e.target.value })} data-testid={`qsev-${q.id}`}>{["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" className="accent-[#E5A93C]" checked={!!q.required} onChange={(e) => onChange({ required: e.target.checked })} data-testid={`qreq-${q.id}`} /> Required</label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" className="accent-[#E5A93C]" checked={!!q.evidence_required} onChange={(e) => onChange({ evidence_required: e.target.checked })} data-testid={`qevid-${q.id}`} /> Photo evidence required</label>
        </div>
      )}
    </div>
  );
}
