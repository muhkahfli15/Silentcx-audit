import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import { Logo } from "@/components/silentcx/primitives";
import {
  KeyRound, Building2, PackageCheck, PlusCircle, Store, Target,
  UploadCloud, FileText, CheckCircle2, ChevronLeft, ChevronRight, Trash2, Plus, Loader2,
} from "lucide-react";

const STEPS = [
  { n: 1, name: "Account", icon: KeyRound },
  { n: 2, name: "Company", icon: Building2 },
  { n: 3, name: "Package", icon: PackageCheck },
  { n: 4, name: "Add-Ons", icon: PlusCircle },
  { n: 5, name: "Outlets", icon: Store },
  { n: 6, name: "Objectives", icon: Target },
  { n: 7, name: "Documents", icon: UploadCloud },
  { n: 8, name: "Summary", icon: FileText },
  { n: 9, name: "Confirm", icon: CheckCircle2 },
];

const INDUSTRIES = ["F&B / Cafe", "F&B / Restaurant", "Retail", "Hospitality", "Beauty & Wellness", "Clinic / Healthcare", "Automotive", "Franchise / Multi-Outlet", "Other"];

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState([]);
  const [addons, setAddons] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [company, setCompany] = useState({ name: "", industry: "F&B / Cafe", company_type: "Independent", address: "", city: "", website: "", instagram: "", contact_person: user?.name || "", position: "" });
  const [pkgKey, setPkgKey] = useState("insight");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [outlets, setOutlets] = useState([{ name: "", city: "", address: "" }]);
  const [objectives, setObjectives] = useState([""]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    api.packages().then(setPackages);
    api.addons().then(setAddons);
  }, []);

  const pkg = useMemo(() => packages.find((p) => p.key === pkgKey), [packages, pkgKey]);
  const relevantAddons = useMemo(() => addons.filter((a) => a.applicable_packages?.includes(pkgKey) && a.active), [addons, pkgKey]);
  const chosenAddons = useMemo(() => addons.filter((a) => selectedAddons.includes(a.key)), [addons, selectedAddons]);

  const basePrice = useMemo(() => {
    if (!pkg) return 0;
    if (pkg.key === "performance") {
      const tier = (pkg.price_tiers || []).find((t) => t.outlets === Math.max(3, outlets.length));
      return tier ? tier.price : pkg.price;
    }
    return pkg.price;
  }, [pkg, outlets.length]);
  const addonsTotal = chosenAddons.reduce((s, a) => s + (a.price || 0), 0);
  const total = basePrice + addonsTotal;

  const toggleAddon = (k) => setSelectedAddons((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k]);

  const canNext = () => {
    if (step === 2) return company.name && company.city;
    if (step === 5) return outlets.every((o) => o.name && o.city);
    if (step === 6) return objectives.some((o) => o.trim());
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await api.onboarding({
        company, package_key: pkgKey, addons: selectedAddons,
        outlets, objectives: objectives.filter((o) => o.trim()), documents,
      });
      setResult(res);
      await refresh();
      setStep(9);
      toast.success("Project created!");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  const next = () => { if (!canNext()) return toast.error("Please complete required fields."); step === 8 ? submit() : setStep((s) => Math.min(9, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-[#06080C] sx-grid-bg">
      <header className="border-b border-[#212836] px-4 sm:px-8 h-16 flex items-center justify-between">
        <Logo to="" />
        <span className="text-sm text-slate-400">Client Onboarding</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* stepper */}
        <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const active = step === s.n, done = step > s.n;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.n}>
                <div className={`flex items-center gap-2 shrink-0 ${active ? "text-[#E5A93C]" : done ? "text-emerald-400" : "text-slate-600"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${active ? "border-[#E5A93C] bg-[#E5A93C]/10" : done ? "border-emerald-500/40 bg-emerald-500/10" : "border-[#212836]"}`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{s.name}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-px w-4 sm:w-6 shrink-0 ${done ? "bg-emerald-500/40" : "bg-[#212836]"}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="sx-card p-6 sm:p-8 sx-fade-up" key={step}>
          {step === 1 && (
            <Section title="Account Information" desc="Confirm your account details.">
              <div className="grid sm:grid-cols-2 gap-4">
                <ReadField label="Full Name" value={user?.name} />
                <ReadField label="Email" value={user?.email} />
                <ReadField label="WhatsApp" value={user?.whatsapp} />
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section title="Company Information" desc="Tell us about your business.">
              <div className="grid sm:grid-cols-2 gap-4">
                <Txt label="Company Name *" v={company.name} on={(x) => setCompany({ ...company, name: x })} tid="company-name" />
                <Sel label="Industry" v={company.industry} on={(x) => setCompany({ ...company, industry: x })} opts={INDUSTRIES} tid="company-industry" />
                <Sel label="Company Type" v={company.company_type} on={(x) => setCompany({ ...company, company_type: x })} opts={["Independent", "Chain", "Franchise / Multi-Outlet"]} tid="company-type" />
                <Txt label="City *" v={company.city} on={(x) => setCompany({ ...company, city: x })} tid="company-city" />
                <div className="sm:col-span-2"><Txt label="Business Address" v={company.address} on={(x) => setCompany({ ...company, address: x })} tid="company-address" /></div>
                <Txt label="Website" v={company.website} on={(x) => setCompany({ ...company, website: x })} tid="company-website" />
                <Txt label="Instagram" v={company.instagram} on={(x) => setCompany({ ...company, instagram: x })} tid="company-instagram" />
                <Txt label="Main Contact Person" v={company.contact_person} on={(x) => setCompany({ ...company, contact_person: x })} tid="company-contact" />
                <Txt label="Position" v={company.position} on={(x) => setCompany({ ...company, position: x })} tid="company-position" />
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Package Selection" desc="Pick the audit tier that fits your goals.">
              <div className="grid lg:grid-cols-3 gap-4">
                {packages.map((p) => (
                  <button key={p.key} onClick={() => setPkgKey(p.key)} className={`sx-card p-5 text-left transition-all ${pkgKey === p.key ? "border-[#E5A93C] shadow-[0_0_20px_rgba(229,169,60,0.15)]" : "hover:border-[#212836]"}`} data-testid={`pkg-${p.key}`}>
                    {p.recommended && <span className="sx-chip bg-[#E5A93C] text-[#06080C] font-semibold mb-2">Recommended</span>}
                    <h4 className="font-head font-bold text-white">{p.name}</h4>
                    <div className="font-mono text-2xl font-bold text-[#E5A93C] mt-2">{formatIDR(p.price)}</div>
                    <p className="text-xs text-slate-500 mt-1">{p.indicators}</p>
                    <ul className="mt-3 space-y-1.5">{p.features.slice(0, 5).map((f) => <li key={f} className="text-xs text-slate-400 flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#E5A93C] shrink-0 mt-0.5" />{f}</li>)}</ul>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Add-On Modules" desc={`Optional enhancements for ${pkg?.name}.`}>
              <div className="grid sm:grid-cols-2 gap-3">
                {relevantAddons.map((a) => (
                  <label key={a.key} className={`sx-card p-4 flex items-start gap-3 cursor-pointer transition-colors ${selectedAddons.includes(a.key) ? "border-[#E5A93C]/60" : ""}`} data-testid={`addon-${a.key}`}>
                    <input type="checkbox" checked={selectedAddons.includes(a.key)} onChange={() => toggleAddon(a.key)} className="mt-1 accent-[#E5A93C]" />
                    <div className="flex-1"><div className="flex justify-between gap-2"><span className="font-medium text-slate-100 text-sm">{a.name}</span><span className="font-mono text-sm text-[#E5A93C] whitespace-nowrap">{a.pricing_type === "fixed" ? formatIDR(a.price) : a.pricing_type === "starting_from" ? `from ${formatIDR(a.price)}` : a.pricing_type === "quotation" ? "Quote" : "Actual"}</span></div><p className="text-xs text-slate-500 mt-1">{a.description}</p></div>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section title="Outlet Information" desc="Add the outlets to be audited.">
              <div className="space-y-3">
                {outlets.map((o, i) => (
                  <div key={i} className="sx-card p-4 grid sm:grid-cols-3 gap-3 items-end">
                    <Txt label={`Outlet ${i + 1} Name *`} v={o.name} on={(x) => setOutlets(outlets.map((oo, j) => j === i ? { ...oo, name: x } : oo))} tid={`outlet-name-${i}`} />
                    <Txt label="City *" v={o.city} on={(x) => setOutlets(outlets.map((oo, j) => j === i ? { ...oo, city: x } : oo))} tid={`outlet-city-${i}`} />
                    <div className="flex gap-2 items-end"><div className="flex-1"><Txt label="Address" v={o.address} on={(x) => setOutlets(outlets.map((oo, j) => j === i ? { ...oo, address: x } : oo))} tid={`outlet-address-${i}`} /></div>{outlets.length > 1 && <button className="sx-btn-ghost text-red-400 mb-0.5" onClick={() => setOutlets(outlets.filter((_, j) => j !== i))} data-testid={`remove-outlet-${i}`}><Trash2 className="w-4 h-4" /></button>}</div>
                  </div>
                ))}
                <button className="sx-btn-secondary" onClick={() => setOutlets([...outlets, { name: "", city: "", address: "" }])} data-testid="add-outlet-button"><Plus className="w-4 h-4" /> Add Outlet</button>
                {pkg?.key === "performance" && <p className="text-xs text-slate-500">Performance package covers 3–5 outlets. Pricing adjusts automatically.</p>}
              </div>
            </Section>
          )}

          {step === 6 && (
            <Section title="Audit Objectives" desc="What should we focus on?">
              <div className="space-y-3">
                {objectives.map((o, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className="sx-input" value={o} onChange={(e) => setObjectives(objectives.map((oo, j) => j === i ? e.target.value : oo))} placeholder="e.g. Evaluate barista service quality" data-testid={`objective-${i}`} />
                    {objectives.length > 1 && <button className="sx-btn-ghost text-red-400" onClick={() => setObjectives(objectives.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                <button className="sx-btn-secondary" onClick={() => setObjectives([...objectives, ""])} data-testid="add-objective-button"><Plus className="w-4 h-4" /> Add Objective</button>
              </div>
            </Section>
          )}

          {step === 7 && (
            <Section title="Supporting Documents" desc="Upload SOPs, brand guidelines, menus (optional).">
              <label className="border border-dashed border-[#212836] rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A93C]/40 transition-colors" data-testid="doc-upload">
                <UploadCloud className="w-8 h-8 text-[#E5A93C] mb-3" />
                <span className="text-sm text-slate-300">Click to upload documents</span>
                <span className="text-xs text-slate-600 mt-1">PDF, DOCX, images</span>
                <input type="file" multiple className="hidden" onChange={(e) => setDocuments([...documents, ...Array.from(e.target.files).map((f) => ({ name: f.name, size: f.size }))])} />
              </label>
              {documents.length > 0 && <div className="mt-4 space-y-2">{documents.map((d, i) => <div key={i} className="flex justify-between items-center sx-card p-3 text-sm"><span className="text-slate-300 flex gap-2 items-center"><FileText className="w-4 h-4 text-[#E5A93C]" />{d.name}</span><button className="text-red-400" onClick={() => setDocuments(documents.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button></div>)}</div>}
            </Section>
          )}

          {step === 8 && (
            <Section title="Order Summary" desc="Review before creating your project.">
              <div className="sx-card p-5 space-y-3">
                <Row l="Company" r={company.name} />
                <Row l="Package" r={pkg?.name} />
                <Row l={`Base (${outlets.length} outlet${outlets.length > 1 ? "s" : ""})`} r={formatIDR(basePrice)} />
                {chosenAddons.map((a) => <Row key={a.key} l={a.name} r={a.pricing_type === "fixed" ? formatIDR(a.price) : "TBD"} muted />)}
                <div className="border-t border-[#212836] pt-3"><Row l="Total" r={formatIDR(total)} bold /></div>
              </div>
              <p className="text-xs text-slate-500 mt-3">An invoice will be generated. Purchase allowance: {formatIDR(pkg?.purchase_allowance)} / visit.</p>
            </Section>
          )}

          {step === 9 && result && (
            <div className="text-center py-6" data-testid="onboarding-confirm">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="font-head text-2xl font-bold text-white">You're all set!</h3>
              <p className="text-slate-400 mt-2">Your audit project has been submitted for review.</p>
              <div className="grid sm:grid-cols-3 gap-3 max-w-lg mx-auto mt-8">
                <IdCard label="Client ID" value={result.client_id} />
                <IdCard label="Project ID" value={result.project_id} />
                <IdCard label="Invoice ID" value={result.invoice_id} />
              </div>
              <button className="sx-btn-primary mt-8" onClick={() => nav("/app")} data-testid="go-dashboard-button">Go to Dashboard <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          {step < 9 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-[#212836]">
              <button className="sx-btn-secondary" onClick={back} disabled={step === 1} data-testid="onboarding-back-button"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button className="sx-btn-primary" onClick={next} disabled={submitting} data-testid="onboarding-next-button">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 8 ? "Create Project" : "Continue"} {!submitting && step !== 8 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, desc, children }) => (<div><h3 className="font-head text-xl font-bold text-white">{title}</h3><p className="text-sm text-slate-400 mt-1 mb-6">{desc}</p>{children}</div>);
const Txt = ({ label, v, on, tid }) => (<div><label className="sx-label">{label}</label><input className="sx-input" value={v} onChange={(e) => on(e.target.value)} data-testid={tid} /></div>);
const Sel = ({ label, v, on, opts, tid }) => (<div><label className="sx-label">{label}</label><select className="sx-input" value={v} onChange={(e) => on(e.target.value)} data-testid={tid}>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>);
const ReadField = ({ label, value }) => (<div><label className="sx-label">{label}</label><div className="sx-input bg-[#151B23] text-slate-400">{value || "—"}</div></div>);
const Row = ({ l, r, bold, muted }) => (<div className="flex justify-between text-sm"><span className={muted ? "text-slate-500" : "text-slate-300"}>{l}</span><span className={`font-mono ${bold ? "text-lg font-bold text-[#E5A93C]" : "text-slate-200"}`}>{r}</span></div>);
const IdCard = ({ label, value }) => (<div className="sx-card p-4"><div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div><div className="font-mono text-[#E5A93C] font-semibold mt-1">{value}</div></div>);
