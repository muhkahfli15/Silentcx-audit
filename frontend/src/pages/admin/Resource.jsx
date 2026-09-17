import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Loading, EmptyState, StatusBadge, ScoreBadge } from "@/components/silentcx/primitives";
import { formatIDR, formatDate } from "@/lib/format";
import { Search, Database } from "lucide-react";

const CONFIG = {
  clients: { title: "Clients", subtitle: "All client accounts.", cols: [["name", "Name"], ["email", "Email"], ["whatsapp", "WhatsApp"], ["client_id", "Client ID"], ["status", "Status", "status"]] },
  shoppers: { title: "Verified Shoppers", subtitle: "Your mystery shopper pool.", cols: [["name", "Name"], ["email", "Email"], ["city", "City"], ["preferred_industry", "Industry"], ["rating", "Rating"], ["status", "Status", "status"]] },
  companies: { title: "Companies", subtitle: "Registered client companies.", cols: [["name", "Company"], ["industry", "Industry"], ["company_type", "Type"], ["city", "City"], ["contact_person", "Contact"]] },
  outlets: { title: "Outlets", subtitle: "All audited locations.", cols: [["name", "Outlet"], ["city", "City"], ["latest_cx", "CX", "score"], ["latest_sop", "SOP", "pct"], ["last_audit", "Last Audit", "date"], ["status", "Status", "status"]] },
  assignments: { title: "Assignments", subtitle: "Shopper task assignments.", cols: [["audit_id", "Audit"], ["outlet", "Outlet"], ["visit_window", "Window"], ["reward", "Reward", "money"], ["status", "Status", "status"]] },
  invoices: { title: "Invoices", subtitle: "Billing across all projects.", cols: [["invoice_id", "Invoice"], ["client", "Client"], ["package", "Package"], ["total", "Total", "money"], ["status", "Status", "status"]] },
  questionnaires: { title: "Questionnaires", subtitle: "Audit question sets.", cols: [["name", "Name"], ["service_type", "Service"], ["active", "Active", "bool"]] },
  templates: { title: "Audit Templates", subtitle: "Reusable audit blueprints.", cols: [["name", "Template"], ["industry", "Industry"], ["package", "Package"], ["active", "Active", "bool"]] },
  categories: { title: "Categories", subtitle: "Scoring categories & weights.", cols: [["name", "Category"], ["weight", "Weight", "pct"], ["active", "Active", "bool"]] },
  consultations: { title: "Consultations", subtitle: "Client strategy sessions (synced to Google Calendar when connected).", cols: [["client_name", "Client"], ["project_id", "Project"], ["topic", "Topic"], ["scheduled_at", "Scheduled", "datetime"], ["provider", "Provider"], ["meet_link", "Meet", "link"], ["status", "Status", "status"]] },
};

export default function Resource({ coll }) {
  const cfg = CONFIG[coll];
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => { setRows(null); api.adminList(coll).then(setRows); }, [coll]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [rows, q]);

  if (!rows) return <Loading />;

  const cell = (r, [key, , type]) => {
    const v = r[key];
    if (type === "status") return <StatusBadge status={v} />;
    if (type === "score") return v ? <ScoreBadge score={v} /> : "—";
    if (type === "pct") return v != null ? `${v}%` : "—";
    if (type === "money") return formatIDR(v);
    if (type === "date") return formatDate(v);
    if (type === "datetime") return v ? new Date(v).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB" : "—";
    if (type === "link") return v ? <a href={v} target="_blank" rel="noreferrer" className="text-[#E5A93C] hover:underline">Open</a> : "—";
    if (type === "bool") return v ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-500">No</span>;
    return <span className="text-slate-300">{v ?? "—"}</span>;
  };

  return (
    <div className="sx-fade-up">
      <PageHeader title={cfg.title} subtitle={cfg.subtitle} testid={`admin-${coll}`}
        action={<div className="relative"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" /><input className="sx-input pl-9 w-64" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} data-testid={`${coll}-search`} /></div>} />
      {filtered.length === 0 ? <EmptyState icon={Database} title="No records found" /> : (
        <div className="sx-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#212836] bg-[#151B23]/60 text-slate-400 text-xs uppercase tracking-wider">{cfg.cols.map((c) => <th key={c[0]} className="text-left px-4 py-3 font-semibold">{c[1]}</th>)}</tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-[#212836]/60 hover:bg-[#151B23]/40" data-testid={`${coll}-row-${i}`}>
                    {cfg.cols.map((c) => <td key={c[0]} className="px-4 py-3">{cell(r, c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
