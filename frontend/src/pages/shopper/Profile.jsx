import React from "react";
import { useShopper } from "./ShopperLayout";
import { StatusBadge } from "@/components/silentcx/primitives";
import { Star, ShieldCheck } from "lucide-react";

export default function Profile() {
  const { data } = useShopper();
  const u = data.user;
  const Row = ({ l, r }) => (<div className="flex justify-between py-2.5 border-b border-[#212836]/60 last:border-0 text-sm"><span className="text-slate-500">{l}</span><span className="text-slate-200 text-right">{r || "—"}</span></div>);
  return (
    <div className="sx-fade-up" data-testid="shopper-profile">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#E5A93C]/15 text-[#E5A93C] flex items-center justify-center font-head font-bold text-xl">{u.name[0]}</div>
        <div><h1 className="font-head text-lg font-bold text-white">{u.name}</h1><div className="flex items-center gap-2 mt-1"><StatusBadge status={u.status} />{u.status === "verified" && <span className="sx-chip bg-emerald-500/10 text-emerald-400 border-emerald-500/30"><ShieldCheck className="w-3 h-3" /> Verified</span>}</div></div>
      </div>
      {u.rating && <div className="sx-card p-4 mb-4 flex items-center justify-between"><span className="text-sm text-slate-400">Reliability Rating</span><span className="flex items-center gap-1 font-mono text-[#E5A93C]"><Star className="w-4 h-4 fill-[#E5A93C]" /> {u.rating}</span></div>}
      <div className="sx-card p-4">
        <Row l="Email" r={u.email} /><Row l="WhatsApp" r={u.whatsapp} /><Row l="City" r={u.city} /><Row l="Gender" r={u.gender} />
        <Row l="Occupation" r={u.occupation} /><Row l="Transportation" r={u.transportation} /><Row l="Preferred Industry" r={u.preferred_industry} />
        <Row l="Available Cities" r={(u.available_cities || []).join(", ")} /><Row l="Bank" r={u.bank} />
      </div>
    </div>
  );
}
