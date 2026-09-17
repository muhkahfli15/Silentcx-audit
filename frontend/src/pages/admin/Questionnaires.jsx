import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, EmptyState } from "@/components/silentcx/primitives";
import { QuestionnaireEditor } from "./QuestionnaireEditor";
import { FileQuestion, Plus, Copy, Trash2 } from "lucide-react";

export default function Questionnaires() {
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(null);
  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);

  const load = async (keepId) => {
    const rows = await api.adminList("questionnaires");
    setList(rows);
    setSelected((cur) => rows.find((r) => r.id === (keepId || cur?.id)) || rows[0] || null);
  };
  useEffect(() => { load(); api.adminList("categories").then(setCategories); api.packages().then(setPackages); }, []);

  const create = async () => {
    try { const q = await api.createQuestionnaire({ name: "New Questionnaire", questions: [] }); toast.success("Questionnaire created"); await load(q.id); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const duplicate = async (q) => {
    try { const c = await api.duplicateQuestionnaire(q.id); toast.success("Duplicated"); await load(c.id); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const remove = async (q) => {
    if (!window.confirm(`Delete "${q.name}"?`)) return;
    try { await api.deleteQuestionnaire(q.id); toast.success("Deleted"); setSelected(null); await load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  if (!list) return <Loading />;

  return (
    <div className="sx-fade-up">
      <PageHeader title="Questionnaire Builder" subtitle="Design audit question sets — drag to reorder, group by category, link to packages." testid="admin-questionnaires"
        action={<button className="sx-btn-primary" onClick={create} data-testid="create-questionnaire-button"><Plus className="w-4 h-4" /> New Questionnaire</button>} />
      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-2" data-testid="questionnaire-list">
          {list.length === 0 && <EmptyState icon={FileQuestion} title="No questionnaires" />}
          {list.map((q) => (
            <div key={q.id} onClick={() => setSelected(q)}
              className={`sx-card p-4 cursor-pointer transition-colors group ${selected?.id === q.id ? "border-[#E5A93C]/60 bg-[#E5A93C]/5" : "hover:bg-[#151B23]/60"}`} data-testid={`questionnaire-item-${q.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-slate-100 truncate">{q.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{q.questions?.length || 0} questions · {q.service_type}{q.industry ? ` · ${q.industry}` : ""}</div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700/40 text-slate-500"}`}>{q.active ? "Active" : "Draft"}</span>
                    {(q.package_keys || []).map((k) => <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5A93C]/10 text-[#E5A93C] capitalize">{k}</span>)}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); duplicate(q); }} className="p-1 text-slate-500 hover:text-slate-200" title="Duplicate" data-testid={`duplicate-${q.id}`}><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); remove(q); }} className="p-1 text-slate-500 hover:text-red-400" title="Delete" data-testid={`delete-${q.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          {selected ? <QuestionnaireEditor key={selected.id} questionnaire={selected} categories={categories} packages={packages} onSaved={(q) => load(q.id)} />
            : <EmptyState icon={FileQuestion} title="Select or create a questionnaire" />}
        </div>
      </div>
    </div>
  );
}
