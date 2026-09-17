import React, { useState } from "react";
import { useClient } from "./ClientLayout";
import { PageHeader, SeverityBadge, EmptyState } from "@/components/silentcx/primitives";
import { AlertTriangle } from "lucide-react";

export default function Findings() {
  const { data } = useClient();
  const findings = (data.reports || []).flatMap((r) => r.findings.map((f) => ({ ...f, outlet: r.outlet_name, audit: r.audit_id })));
  const [sev, setSev] = useState("all");
  const filtered = findings.filter((f) => sev === "all" || f.severity === sev);
  const counts = ["critical", "high", "medium", "low"].map((s) => ({ s, n: findings.filter((f) => f.severity === s).length }));

  return (
    <div className="sx-fade-up">
      <PageHeader title="Findings" subtitle="Operational issues found across your audits." testid="client-findings" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {counts.map(({ s, n }) => (
          <button key={s} onClick={() => setSev(sev === s ? "all" : s)} className={`sx-card p-4 text-left transition-colors ${sev === s ? "border-[#E5A93C]/50" : ""}`} data-testid={`finding-filter-${s}`}>
            <div className="font-mono text-2xl font-bold text-slate-100">{n}</div>
            <SeverityBadge level={s} />
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState icon={AlertTriangle} title="No findings" /> : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className="sx-card p-4 flex items-start justify-between gap-4" data-testid={`finding-${f.id}`}>
              <div><div className="flex items-center gap-2"><h4 className="text-sm font-semibold text-slate-100">{f.title}</h4><SeverityBadge level={f.severity} /></div><p className="text-xs text-slate-400 mt-1">{f.description}</p><div className="text-xs text-slate-600 mt-2">{f.outlet} · {f.category} · {f.audit}</div></div>
              <span className="sx-chip border-[#212836] text-slate-400 capitalize whitespace-nowrap">{f.status.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
