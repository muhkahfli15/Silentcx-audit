import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { FolderKanban, ChevronDown, UserPlus, Send } from "lucide-react";

const FLOW = ["awaiting_review", "confirmed", "audit_preparation", "shopper_assigned", "scheduled", "visit_completed", "under_review", "report_preparation", "report_published", "completed"];

export default function Projects() {
  const [projects, setProjects] = useState(null);
  const [shoppers, setShoppers] = useState([]);
  const [qns, setQns] = useState([]);
  const [qnPick, setQnPick] = useState({});
  const [open, setOpen] = useState(null);
  const load = () => api.adminList("projects").then(setProjects);
  useEffect(() => { load(); api.adminList("shoppers").then((s) => setShoppers(s.filter((x) => x.status === "verified"))); api.adminList("questionnaires").then((q) => setQns(q.filter((x) => x.active && x.questions?.length))); }, []);
  if (!projects) return <Loading />;

  const setStatus = async (p, status) => {
    try { await api.projectStatus(p.project_id, { status }); toast.success(status === "report_published" ? "Report published to client" : `Status → ${status.replace(/_/g, " ")}`); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const assign = async (p, shopper_id) => {
    if (!shopper_id) return;
    const sh = shoppers.find((s) => s.id === shopper_id);
    try {
      await api.createAssignment({ project_id: p.project_id, shopper_id, questionnaire_id: qnPick[p.project_id] || null, outlet: "Assigned Outlet", scenario: "Conduct full CX audit", required_purchase: "1 item", reward: 250000, audit_id: `AUD-${Math.floor(Math.random() * 9000 + 1000)}` });
      toast.success(`Assigned to ${sh?.name}`); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="sx-fade-up">
      <PageHeader title="Audit Projects" subtitle="Manage the audit workflow — assign shoppers, publish reports." testid="admin-projects" />
      {projects.length === 0 ? <EmptyState icon={FolderKanban} title="No projects" /> : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="sx-card p-5" data-testid={`project-${p.project_id}`}>
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono text-[#E5A93C]">{p.project_id}</span><StatusBadge status={p.status} /></div>
                  <p className="text-sm text-slate-300 mt-1">{p.package_snapshot?.name} · {p.outlets?.length} outlet(s)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Created {formatDate(p.created_at)} · Add-ons: {p.addon_snapshot?.length ? p.addon_snapshot.map((a) => a.name).join(", ") : "none"}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  <div className="relative">
                    <select className="sx-input w-auto text-xs py-2 pr-8" value={qnPick[p.project_id] || ""} onChange={(e) => setQnPick((s) => ({ ...s, [p.project_id]: e.target.value }))} data-testid={`questionnaire-pick-${p.project_id}`}>
                      <option value="">Questionnaire: auto-match</option>
                      {qns.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <select className="sx-input w-auto text-xs py-2 pr-8" value="" onChange={(e) => assign(p, e.target.value)} data-testid={`assign-shopper-${p.project_id}`}>
                      <option value="">Assign shopper…</option>
                      {shoppers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <select className="sx-input w-auto text-xs py-2 pr-8" value={p.status} onChange={(e) => setStatus(p, e.target.value)} data-testid={`status-${p.project_id}`}>
                      {FLOW.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  {p.status !== "report_published" && <button onClick={() => setStatus(p, "report_published")} className="sx-btn-primary text-xs py-2" data-testid={`publish-${p.project_id}`}><Send className="w-3.5 h-3.5" /> Publish Report</button>}
                  <Link to={`/app/reports/${p.project_id}`} className="sx-btn-secondary text-xs py-2">Preview</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
