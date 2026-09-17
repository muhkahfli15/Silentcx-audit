import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, Loading, StatusBadge, ScoreBadge, SeverityBadge, SectionCard, EmptyState } from "@/components/silentcx/primitives";
import { formatDate, formatIDR } from "@/lib/format";
import { ArrowLeft, FileBarChart, MapPin, Target, ClipboardCheck, Users, CheckCircle2, Clock, Eye } from "lucide-react";

const FLOW = ["awaiting_review", "confirmed", "audit_preparation", "shopper_assigned", "scheduled", "visit_completed", "under_review", "report_preparation", "report_published", "completed"];

const Info = ({ label, value }) => (<div><div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div><div className="text-slate-200">{value}</div></div>);

export default function AdminProjectDetail() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  useEffect(() => { api.adminProjectDetail(id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === null) return <Loading />;
  if (!d) return <EmptyState title="Project not found" action={<Link to="/admin/projects" className="sx-btn-secondary">Back to Projects</Link>} />;

  const { project, report, outlets, company, client, assignments, submissions, invoice } = d;
  const stepIndex = FLOW.indexOf(project.status);

  return (
    <div className="sx-fade-up" data-testid="admin-project-detail">
      <Link to="/admin/projects" className="sx-btn-ghost mb-4 -ml-2" data-testid="project-detail-back"><ArrowLeft className="w-4 h-4" /> Audit Projects</Link>
      <PageHeader title={project.project_id} subtitle={`${project.package_snapshot?.name} · ${company?.name || "—"}`}
        action={report ? <Link to={`/admin/reports/${project.project_id}`} className="sx-btn-primary" data-testid="project-detail-view-report"><FileBarChart className="w-4 h-4" /> View Report</Link> : <StatusBadge status={project.status} />} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Overview">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Status" value={<StatusBadge status={project.status} />} />
              <Info label="Package" value={project.package_snapshot?.name} />
              <Info label="Client" value={client ? `${client.name} (${client.email})` : "—"} />
              <Info label="Company" value={company ? `${company.name} · ${company.industry}` : "—"} />
              <Info label="Add-ons" value={project.addon_snapshot?.length ? project.addon_snapshot.map((a) => a.name).join(", ") : "None"} />
              <Info label="Purchase Allowance" value={formatIDR(project.purchase_allowance)} />
            </div>
          </SectionCard>

          <SectionCard title="Audit Objectives">
            {project.objectives?.length ? <ul className="space-y-2">{project.objectives.map((o, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><Target className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />{o}</li>)}</ul> : <p className="text-sm text-slate-500">No objectives set.</p>}
          </SectionCard>

          <SectionCard title={`Assignments (${assignments.length})`}>
            {assignments.length === 0 ? <p className="text-sm text-slate-500">No shopper assigned yet.</p> : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50" data-testid={`detail-assignment-${a.id}`}>
                    <div><div className="text-sm text-slate-200 font-mono">{a.audit_id}</div><div className="text-xs text-slate-500">{a.outlet} · {a.visit_window}</div></div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={`Submissions (${submissions.length})`}>
            {submissions.length === 0 ? <p className="text-sm text-slate-500">No submissions yet.</p> : (
              <div className="space-y-2">
                {submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50">
                    <div className="flex items-center gap-2"><span className="font-mono text-[#E5A93C] text-sm">{s.audit_id}</span><StatusBadge status={s.status} />{s.score && <ScoreBadge score={s.score} />}</div>
                    <Link to={`/admin/qc/${s.id}`} className="sx-chip text-slate-300 border-[#212836] hover:border-[#E5A93C]/40" data-testid={`detail-submission-${s.id}`}><Eye className="w-3.5 h-3.5" /> Detail</Link>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {report && (
            <SectionCard title="Report Snapshot" right={<Link to={`/admin/reports/${project.project_id}`} className="text-sm text-[#E5A93C]">Full report</Link>}>
              <div className="flex items-center gap-4 mb-4">
                <ScoreBadge score={report.overall_cx_score} />
                {report.sop_compliance && <span className="sx-chip border-[#212836] text-slate-300">SOP {report.sop_compliance.score}%</span>}
                <span className="text-xs text-slate-500">Audited {formatDate(report.audit_date)}</span>
              </div>
              <div className="space-y-2">
                {(report.findings || []).slice(0, 4).map((f) => (
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
          <SectionCard title="Workflow Timeline">
            <ol className="space-y-3">
              {FLOW.map((s, i) => {
                const done = i <= stepIndex;
                return (
                  <li key={s} className="flex gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${done ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "border-[#212836] text-slate-600"}`}>{done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}</div>
                    <span className={`text-sm capitalize ${done ? "text-slate-200" : "text-slate-500"}`}>{s.replace(/_/g, " ")}</span>
                  </li>
                );
              })}
            </ol>
          </SectionCard>
          <SectionCard title={`Outlets (${outlets.length})`}>
            {outlets.length === 0 ? <p className="text-sm text-slate-500">No outlets.</p> : outlets.map((o) => <div key={o.id} className="flex items-center gap-2 text-sm text-slate-300 py-1"><MapPin className="w-4 h-4 text-[#E5A93C]" />{o.name} · {o.city}</div>)}
          </SectionCard>
          {invoice && (
            <SectionCard title="Invoice">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{invoice.invoice_id}</span><StatusBadge status={invoice.status} /></div>
                <div className="flex justify-between"><span className="text-slate-400">Total</span><span className="font-mono text-slate-100">{formatIDR(invoice.total)}</span></div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
