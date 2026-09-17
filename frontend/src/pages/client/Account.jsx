import React from "react";
import { useAuth } from "@/lib/auth";
import { useClient } from "./ClientLayout";
import { PageHeader, SectionCard } from "@/components/silentcx/primitives";

export default function Account() {
  const { user } = useAuth();
  const { data } = useClient();
  const proj = data.projects[0];
  const Row = ({ l, r }) => (<div className="flex justify-between py-2.5 border-b border-[#212836]/60 text-sm last:border-0"><span className="text-slate-500">{l}</span><span className="text-slate-200">{r || "—"}</span></div>);
  return (
    <div className="sx-fade-up">
      <PageHeader title="Account" subtitle="Your profile and package details." testid="client-account" />
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Profile">
          <Row l="Full Name" r={user?.name} /><Row l="Email" r={user?.email} /><Row l="WhatsApp" r={user?.whatsapp} /><Row l="Client ID" r={user?.client_id} />
        </SectionCard>
        <SectionCard title="Current Package & Entitlements">
          <Row l="Package" r={proj?.package_snapshot?.name} />
          <Row l="Purchase Allowance" r={`IDR ${proj?.purchase_allowance?.toLocaleString("id-ID")}`} />
          <div className="pt-3"><div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Active Modules</div><div className="flex flex-wrap gap-1.5">{(data.entitlements || []).map((e) => <span key={e} className="sx-chip border-[#212836] text-slate-400 text-[10px] capitalize">{e.replace(/_/g, " ")}</span>)}</div></div>
        </SectionCard>
      </div>
    </div>
  );
}
