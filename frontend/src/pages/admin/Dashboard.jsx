import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, StatCard, Loading, StatusBadge } from "@/components/silentcx/primitives";
import { formatIDR, formatDate } from "@/lib/format";
import {
  Users, Activity, CheckCircle2, UserCheck, ClipboardCheck, FileBarChart,
  ShieldCheck, DollarSign, AlertOctagon, ArrowRight, Zap,
} from "lucide-react";

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.adminDashboard().then(setD); }, []);
  if (!d) return <Loading />;
  return (
    <div className="sx-fade-up">
      <PageHeader title="Admin Cockpit" subtitle="What needs your attention today." testid="admin-dashboard" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Clients" value={d.total_clients} icon={Users} tone="gold" testid="admin-stat-clients" />
        <StatCard label="Active Audits" value={d.active_audits} icon={Activity} tone="blue" />
        <StatCard label="Completed" value={d.completed_audits} icon={CheckCircle2} tone="green" />
        <StatCard label="Active Shoppers" value={d.active_shoppers} icon={ShieldCheck} tone="gold" />
        <StatCard label="Pending Verification" value={d.pending_verification} icon={UserCheck} tone="red" />
        <StatCard label="Pending QC" value={d.pending_qc} icon={ClipboardCheck} tone="red" testid="admin-stat-qc" />
        <StatCard label="Revenue" value={formatIDR(d.revenue)} icon={DollarSign} tone="green" />
        <StatCard label="Unpaid Invoices" value={formatIDR(d.unpaid_invoices)} icon={AlertOctagon} tone="red" />
      </div>

      <div className="sx-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-[#E5A93C]" /><h3 className="font-head font-semibold text-white">Action Required</h3></div>
        <div className="grid sm:grid-cols-2 gap-3">
          {d.action_items.map((a, i) => (
            <Link key={i} to={a.link} className="flex items-center justify-between p-4 rounded-lg bg-[#151B23]/50 hover:bg-[#151B23] transition-colors" data-testid={`action-item-${i}`}>
              <span className="text-sm text-slate-200">{a.label}</span><ArrowRight className="w-4 h-4 text-[#E5A93C]" />
            </Link>
          ))}
        </div>
      </div>

      <div className="sx-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#212836] flex items-center gap-2"><FileBarChart className="w-4 h-4 text-[#E5A93C]" /><h3 className="font-head font-semibold text-white">Recent Projects</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#212836] bg-[#151B23]/60 text-slate-400 text-xs uppercase tracking-wider">{["Project", "Package", "Outlets", "Status", "Created"].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {d.recent_projects.map((p) => (
                <tr key={p.id} className="border-b border-[#212836]/60 hover:bg-[#151B23]/40">
                  <td className="px-4 py-3 font-mono text-[#E5A93C]">{p.project_id}</td>
                  <td className="px-4 py-3 text-slate-300">{p.package_snapshot?.name}</td>
                  <td className="px-4 py-3 text-slate-400">{p.outlets?.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
