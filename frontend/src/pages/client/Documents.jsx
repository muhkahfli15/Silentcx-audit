import React from "react";
import { useClient } from "./ClientLayout";
import { PageHeader, EmptyState, SectionCard } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { FolderOpen, FileText, Download } from "lucide-react";

export default function Documents() {
  const { data } = useClient();
  const docs = (data.projects || []).flatMap((p) => (p.documents || []).map((d) => ({ ...d, project: p.project_id })));
  const reports = (data.reports || []).filter((r) => r.status === "published");
  return (
    <div className="sx-fade-up">
      <PageHeader title="Documents" subtitle="Supporting files and generated reports." testid="client-documents" />
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Uploaded Documents">
          {docs.length === 0 ? <EmptyState icon={FolderOpen} title="No documents uploaded" /> : (
            <div className="space-y-2">{docs.map((d, i) => <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#151B23]/50"><FileText className="w-4 h-4 text-[#E5A93C]" /><span className="text-sm text-slate-200 flex-1">{d.name}</span><span className="text-xs text-slate-600">{d.project}</span></div>)}</div>
          )}
        </SectionCard>
        <SectionCard title="Report Files">
          {reports.length === 0 ? <EmptyState icon={FileText} title="No reports yet" /> : (
            <div className="space-y-2">{reports.map((r) => <a key={r.id} href={`/app/reports/${r.project_id}`} className="flex items-center gap-3 p-3 rounded-lg bg-[#151B23]/50 hover:bg-[#151B23]"><Download className="w-4 h-4 text-[#E5A93C]" /><span className="text-sm text-slate-200 flex-1">SilentCX Report {r.audit_id}</span><span className="text-xs text-slate-600">{r.outlet_name}</span></a>)}</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
