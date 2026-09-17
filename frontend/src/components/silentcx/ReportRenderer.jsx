import React, { useState } from "react";
import { toast } from "sonner";
import { generateReportPDF } from "@/lib/pdf";
import { ScoreDial, ScoreBadge, SeverityBadge, ProgressBar } from "./primitives";
import { scoreRating, formatDate } from "@/lib/format";
import {
  Download, FileText, Gauge, Route, ClipboardCheck, AlertTriangle,
  Lightbulb, Image, BarChart3, Swords, RefreshCw, Building2, CheckCircle2, XCircle, MinusCircle,
} from "lucide-react";

const sentimentColor = { positive: "#10B981", neutral: "#F59E0B", negative: "#F43F5E" };
const sopIcon = { pass: CheckCircle2, deviation: MinusCircle, fail: XCircle };
const sopColor = { pass: "text-emerald-400", deviation: "text-amber-400", fail: "text-red-400" };

function Block({ icon: Icon, title, children, sub }) {
  return (
    <section className="sx-card p-6" data-testid={`report-section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#E5A93C]/10 text-[#E5A93C] flex items-center justify-center"><Icon className="w-4 h-4" /></div>
        <div><h3 className="font-head font-semibold text-white">{title}</h3>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>
      </div>
      {children}
    </section>
  );
}

export default function ReportRenderer({ report, project }) {
  const [downloading, setDownloading] = useState(false);
  const ent = project?.entitlements || [];
  const has = (f) => ent.includes(f);

  const download = () => {
    setDownloading(true);
    try { generateReportPDF(report, project); toast.success("PDF generated"); }
    catch (e) { toast.error("PDF generation failed"); console.error(e); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="sx-card p-6 sm:p-8 bg-gradient-to-br from-[#151B23] via-[#0D1117] to-[#06080C] border-[#E5A93C]/25">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-mono text-xs text-[#E5A93C]">{report.audit_id}</span>
            <h1 className="font-head text-2xl sm:text-3xl font-bold text-white mt-1">{report.outlet_name}</h1>
            <p className="text-sm text-slate-400 mt-1">{report.client_company} · {report.package_name} · {formatDate(report.audit_date)}</p>
          </div>
          <div className="flex items-center gap-6">
            <ScoreDial score={report.overall_cx_score} />
            <button className="sx-btn-primary" onClick={download} disabled={downloading} data-testid="report-download-pdf-button">
              <Download className="w-4 h-4" /> {downloading ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      <Block icon={FileText} title="Executive Summary">
        <p className="text-slate-300 leading-relaxed">{report.executive_summary}</p>
      </Block>

      {/* Category Scores */}
      <Block icon={Gauge} title="Category Scores">
        <div className="space-y-4">
          {report.category_scores.map((c) => {
            const r = scoreRating(c.score);
            return (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-200">{c.name} <span className="text-slate-600 text-xs">· weight {c.weight}%</span></span>
                  <span className="font-mono" style={{ color: r.hex }}>{c.score}</span>
                </div>
                <ProgressBar value={c.score} hex={r.hex} />
              </div>
            );
          })}
        </div>
      </Block>

      {/* Customer Journey */}
      {has("customer_journey") && report.customer_journey && (
        <Block icon={Route} title="Customer Journey">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {report.customer_journey.map((j) => (
              <div key={j.stage} className="sx-card p-3 text-center">
                <div className="text-xs text-slate-400">{j.stage}</div>
                <div className="font-mono text-xl font-bold mt-1" style={{ color: sentimentColor[j.sentiment] }}>{j.score}</div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: sentimentColor[j.sentiment] }}>{j.sentiment}</div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* SOP Compliance */}
      {has("sop_compliance") && report.sop_compliance && (
        <Block icon={ClipboardCheck} title="SOP Compliance" sub={`${report.sop_compliance.score}% compliant`}>
          <div className="space-y-2">
            {report.sop_compliance.items.map((i, idx) => {
              const Icon = sopIcon[i.status];
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50">
                  <span className="text-sm text-slate-300 flex items-center gap-2"><Icon className={`w-4 h-4 ${sopColor[i.status]}`} />{i.item}</span>
                  <span className={`text-xs uppercase tracking-wider ${sopColor[i.status]}`}>{i.status}</span>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {/* Findings */}
      <Block icon={AlertTriangle} title="Key Findings">
        <div className="grid sm:grid-cols-2 gap-3">
          {report.findings.map((f) => (
            <div key={f.id} className="sx-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2"><h4 className="text-sm font-semibold text-slate-100">{f.title}</h4><SeverityBadge level={f.severity} /></div>
              <p className="text-xs text-slate-400">{f.description}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-600"><span>{f.category}</span><span className="capitalize">{f.status.replace(/_/g, " ")}</span></div>
              {has("evidence") && f.evidence?.[0] && <img src={f.evidence[0]} alt="evidence" className="w-full h-28 object-cover rounded-lg mt-3 border border-[#212836]" />}
            </div>
          ))}
        </div>
      </Block>

      {/* Recommendations */}
      <Block icon={Lightbulb} title="Recommendations">
        <div className="space-y-3">
          {report.recommendations.map((r) => (
            <div key={r.id} className="sx-card p-4 flex items-start justify-between gap-4">
              <div><h4 className="text-sm font-semibold text-slate-100">{r.title}</h4><p className="text-xs text-slate-400 mt-1">{r.action}</p><div className="flex gap-3 mt-2 text-xs text-slate-600"><span>Area: {r.responsible_area}</span><span>Target: {formatDate(r.target_date)}</span></div></div>
              <span className="sx-chip bg-[#E5A93C]/10 text-[#E5A93C] border-[#E5A93C]/30 whitespace-nowrap">{r.priority}</span>
            </div>
          ))}
        </div>
      </Block>

      {/* Management Summary */}
      {has("management_summary") && report.management_summary && (
        <Block icon={FileText} title="Management Summary"><p className="text-slate-300 leading-relaxed">{report.management_summary}</p></Block>
      )}

      {/* Multi-Outlet */}
      {has("multi_outlet") && report.outlet_comparison && (
        <Block icon={BarChart3} title="Multi-Outlet Comparison & Ranking">
          <div className="space-y-3">
            {report.outlet_ranking.map((o) => {
              const r = scoreRating(o.score);
              return (
                <div key={o.outlet} className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-500 w-6">#{o.rank}</span>
                  <span className="text-sm text-slate-200 w-40 shrink-0 truncate">{o.outlet}</span>
                  <div className="flex-1"><ProgressBar value={o.score} hex={r.hex} /></div>
                  <span className="font-mono text-sm w-8 text-right" style={{ color: r.hex }}>{o.score}</span>
                </div>
              );
            })}
          </div>
          {report.critical_outlet && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="text-sm font-semibold text-red-400">Critical Outlet: {report.critical_outlet.outlet} ({report.critical_outlet.score})</div>
              <div className="text-xs text-slate-400 mt-1">Red flags: {report.critical_outlet.red_flags.join(" · ")}</div>
            </div>
          )}
        </Block>
      )}

      {/* Competitor */}
      {has("competitor_benchmark") && report.competitor_benchmark && (
        <Block icon={Swords} title={`Competitor Benchmark vs ${report.competitor_benchmark.competitor_name}`}>
          <div className="space-y-3">
            {report.competitor_benchmark.metrics.map((m) => (
              <div key={m.metric} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-40 shrink-0 truncate">{m.metric}</span>
                <div className="flex-1 flex gap-2 items-center">
                  <div className="flex-1"><ProgressBar value={m.client} hex="#E5A93C" /></div>
                  <span className="font-mono text-xs text-[#E5A93C] w-8">{m.client}</span>
                  <div className="flex-1"><ProgressBar value={m.competitor} hex="#8B5CF6" /></div>
                  <span className="font-mono text-xs text-purple-400 w-8">{m.competitor}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs"><span className="text-[#E5A93C]">■ Your Outlet</span><span className="text-purple-400">■ {report.competitor_benchmark.competitor_name}</span></div>
        </Block>
      )}

      {/* Re-Audit */}
      {has("re_audit_comparison") && report.re_audit && (
        <Block icon={RefreshCw} title="Re-Audit Comparison" sub={`+${report.re_audit.delta} improvement`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Metric label="Initial" value={report.re_audit.initial_score} />
            <Metric label="Re-Audit" value={report.re_audit.reaudit_score} gold />
            <Metric label="Resolved" value={report.re_audit.resolved_findings} />
            <Metric label="New" value={report.re_audit.new_findings} />
          </div>
          <div className="space-y-2">
            {report.re_audit.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#151B23]/50 text-sm">
                <span className="text-slate-300">{it.finding}</span>
                <span className="text-xs text-slate-500 capitalize">{it.before} → <span className={it.after === "resolved" ? "text-emerald-400" : "text-amber-400"}>{it.after}</span></span>
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

const Metric = ({ label, value, gold }) => (
  <div className="sx-card p-4 text-center"><div className="text-xs uppercase text-slate-500 tracking-wider">{label}</div><div className={`font-mono text-2xl font-bold mt-1 ${gold ? "text-[#E5A93C]" : "text-slate-100"}`}>{value}</div></div>
);
