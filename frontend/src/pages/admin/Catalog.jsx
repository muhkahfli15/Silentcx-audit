import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading } from "@/components/silentcx/primitives";
import { formatIDR } from "@/lib/format";
import { Save, Star, Power } from "lucide-react";

export default function Catalog() {
  const isAddons = useLocation().pathname.includes("addons");
  return isAddons ? <AddonsAdmin /> : <PackagesAdmin />;
}

function PackagesAdmin() {
  const [pkgs, setPkgs] = useState(null);
  useEffect(() => { api.packages().then(setPkgs); }, []);
  if (!pkgs) return <Loading />;
  const upd = (id, patch) => setPkgs(pkgs.map((p) => p.id === id ? { ...p, ...patch } : p));
  const save = async (p) => {
    try { await api.updatePackage(p.id, { name: p.name, price: p.price, purchase_allowance: p.purchase_allowance, outlet_limit: p.outlet_limit, visits: p.visits, recommended: p.recommended, active: p.active }); toast.success(`${p.name} saved — reflected everywhere`); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <div className="sx-fade-up">
      <PageHeader title="Packages" subtitle="Single source of truth for pricing across the platform." testid="admin-packages" />
      <div className="grid lg:grid-cols-3 gap-4">
        {pkgs.map((p) => (
          <div key={p.id} className={`sx-card p-5 ${p.recommended ? "border-[#E5A93C]/40" : ""}`} data-testid={`pkg-admin-${p.key}`}>
            <input className="sx-input font-head font-semibold mb-3" value={p.name} onChange={(e) => upd(p.id, { name: e.target.value })} />
            <label className="sx-label">Price (IDR)</label>
            <input className="sx-input font-mono" type="number" value={p.price} onChange={(e) => upd(p.id, { price: Number(e.target.value) })} data-testid={`pkg-price-${p.key}`} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className="sx-label">Outlets</label><input className="sx-input" type="number" value={p.outlet_limit} onChange={(e) => upd(p.id, { outlet_limit: Number(e.target.value) })} /></div>
              <div><label className="sx-label">Visits</label><input className="sx-input" type="number" value={p.visits} onChange={(e) => upd(p.id, { visits: Number(e.target.value) })} /></div>
            </div>
            <label className="sx-label mt-3">Allowance</label>
            <input className="sx-input font-mono" type="number" value={p.purchase_allowance} onChange={(e) => upd(p.id, { purchase_allowance: Number(e.target.value) })} />
            <div className="flex gap-2 mt-3">
              <button onClick={() => upd(p.id, { recommended: !p.recommended })} className={`sx-chip ${p.recommended ? "bg-[#E5A93C] text-[#06080C] border-transparent" : "border-[#212836] text-slate-400"}`}><Star className="w-3.5 h-3.5" /> Recommended</button>
              <button onClick={() => upd(p.id, { active: !p.active })} className={`sx-chip ${p.active ? "text-emerald-400 border-emerald-500/30" : "text-slate-500 border-[#212836]"}`}><Power className="w-3.5 h-3.5" /> {p.active ? "Active" : "Inactive"}</button>
            </div>
            <button className="sx-btn-primary w-full mt-4" onClick={() => save(p)} data-testid={`pkg-save-${p.key}`}><Save className="w-4 h-4" /> Save</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddonsAdmin() {
  const [addons, setAddons] = useState(null);
  useEffect(() => { api.addons().then(setAddons); }, []);
  if (!addons) return <Loading />;
  const upd = (id, patch) => setAddons(addons.map((a) => a.id === id ? { ...a, ...patch } : a));
  const save = async (a) => {
    try { await api.updateAddon(a.id, { name: a.name, price: a.price, description: a.description, pricing_type: a.pricing_type, active: a.active }); toast.success(`${a.name} saved`); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <div className="sx-fade-up">
      <PageHeader title="Add-Ons" subtitle="Configure add-on modules, pricing and availability." testid="admin-addons" />
      <div className="space-y-3">
        {addons.map((a) => (
          <div key={a.id} className="sx-card p-4 grid md:grid-cols-[1fr_140px_140px_auto] gap-3 items-end" data-testid={`addon-admin-${a.key}`}>
            <div><label className="sx-label">Name</label><input className="sx-input" value={a.name} onChange={(e) => upd(a.id, { name: e.target.value })} /></div>
            <div><label className="sx-label">Pricing</label><select className="sx-input" value={a.pricing_type} onChange={(e) => upd(a.id, { pricing_type: e.target.value })}><option value="fixed">Fixed</option><option value="starting_from">Starting From</option><option value="quotation">Quotation</option><option value="actual">Actual Cost</option></select></div>
            <div><label className="sx-label">Price</label><input className="sx-input font-mono" type="number" value={a.price} onChange={(e) => upd(a.id, { price: Number(e.target.value) })} /></div>
            <div className="flex gap-2">
              <button onClick={() => upd(a.id, { active: !a.active })} className={`sx-chip ${a.active ? "text-emerald-400 border-emerald-500/30" : "text-slate-500 border-[#212836]"}`}><Power className="w-3.5 h-3.5" /></button>
              <button className="sx-btn-primary text-xs py-2" onClick={() => save(a)} data-testid={`addon-save-${a.key}`}><Save className="w-3.5 h-3.5" /> Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
