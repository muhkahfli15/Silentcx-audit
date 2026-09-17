import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, StatusBadge, ScoreBadge, SeverityBadge, SectionCard, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { FileBarChart, MapPin, Target, CheckCircle2, Clock, PlusCircle } from "lucide-react";

const TIMELINE = ["awaiting_review", "confirmed", "shopper_assigned", "visit_completed", "under_review", "report_published"];

export default function AuditDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  useEffect(() => { api.project(id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === null) return <Loading />;
  if (!d) return <EmptyState title="Audit not found" action={<Link to="/app/audits" className="sx-btn-secondary">Back</Link>} />;

  const { project, report, outlets } = d;
  const stepIndex = TIMELINE.indexOf(project.status);

  return (
    <div className="sx-fade-up">
      <PageHeader title={report?.audit_id || project.project_id} subtitle={`${project.package_snapshot.name} · Created ${formatDate(project.created_at)}`} testid="audit-detail"
        action={report ? <Link to={`/app/reports/${project.project_id}`} className="sx-btn-primary" data-testid="view-report-button"><FileBarChart className="w-4 h-4" /> View Report</Link> : <StatusBadge status={project.status} />} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Overview">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Status" value={<StatusBadge status={project.status} />} />
              <Info label="Package" value={project.package_snapshot.name} />
              <Info label="Outlets" value={outlets.map((o) => o.name).join(", ")} />
              <Info label="Add-ons" value={project.addon_snapshot?.length ? project.addon_snapshot.map((a) => a.name).join(", ") : "None"} />
              {report && <Info label="CX Score" value={<ScoreBadge score={report.overall_cx_score} />} />}
              <Info label="Purchase Allowance" value={`IDR ${project.purchase_allowance?.toLocaleString("id-ID")}`} />
            </div>
          </SectionCard>

          <SectionCard title="Audit Objectives">
            {project.objectives?.length ? <ul className="space-y-2">{project.objectives.map((o, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><Target className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />{o}</li>)}</ul> : <p className="text-sm text-slate-500">No objectives set.</p>}
          </SectionCard>

          {report && (
            <SectionCard title="Key Findings" right={<Link to={`/app/reports/${project.project_id}`} className="text-sm text-[#E5A93C]">Full report</Link>}>
              <div className="space-y-2">
                {report.findings.slice(0, 4).map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50">
                    <div><div className="text-sm text-slate-200">{f.title}</div><div className="text-xs text-slate-500">{f.category}</div></div>
                    <SeverityBadge level={f.severity} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Timeline">
            <ol className="space-y-4">
              {TIMELINE.map((s, i) => {
                const done = i <= stepIndex;
                return (
                  <li key={s} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${done ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "border-[#212836] text-slate-600"}`}>{done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}</div>
                    <span className={`text-sm capitalize ${done ? "text-slate-200" : "text-slate-500"}`}>{s.replace(/_/g, " ")}</span>
                  </li>
                );
              })}
            </ol>
          </SectionCard>
          <SectionCard title="Outlets">
            {outlets.map((o) => <div key={o.id} className="flex items-center gap-2 text-sm text-slate-300 py-1"><MapPin className="w-4 h-4 text-[#E5A93C]" />{o.name} · {o.city}</div>)}
          </SectionCard>
          <RequestAddon project={project} onDone={() => api.project(id).then(setD)} />
        </div>
      </div>
    </div>
  );
}

function RequestAddon({ project, onDone }) {
  const [addons, setAddons] = useState([]);
  useEffect(() => { api.addons().then(setAddons); }, []);
  const available = addons.filter((a) => a.active && a.applicable_packages?.includes(project.package_key) && !project.addons?.includes(a.key));
  const request = async (key) => {
    try { await api.requestAddon({ project_id: project.project_id, addon_key: key }); toast.success("Add-on requested & added to invoice."); onDone(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  if (!available.length) return null;
  return (
    <SectionCard title="Request Add-on">
      <div className="space-y-2">
        {available.slice(0, 4).map((a) => (
          <button key={a.key} onClick={() => request(a.key)} className="w-full flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50 hover:bg-[#151B23] text-left" data-testid={`request-addon-${a.key}`}>
            <span className="text-sm text-slate-200">{a.name}</span><PlusCircle className="w-4 h-4 text-[#E5A93C]" />
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

const Info = ({ label, value }) => (<div><div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div><div className="text-slate-200">{value}</div></div>);
