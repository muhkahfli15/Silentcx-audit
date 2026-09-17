import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import { Logo, Loading } from "@/components/silentcx/primitives";
import {
  ArrowRight, ShieldCheck, Target, FileSearch, TrendingUp, Star,
  Eye, ClipboardCheck, Camera, Sparkles, Menu, X, CheckCircle2, ChevronDown,
} from "lucide-react";

const ICONS = [Eye, ClipboardCheck, Camera, Sparkles];

export default function Landing() {
  const [cms, setCms] = useState(null);
  const [packages, setPackages] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  useEffect(() => {
    api.cms().then(setCms).catch(() => setCms(null));
    api.packages().then(setPackages).catch(() => {});
  }, []);

  if (!cms) return <div className="min-h-screen bg-[#06080C]"><Loading /></div>;

  const nav = [
    ["Methodology", "#methodology"], ["Services", "#services"],
    ["Industries", "#industries"], ["Packages", "#packages"], ["FAQ", "#faq"],
  ];

  return (
    <div className="bg-[#06080C] text-slate-200">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#06080C]/85 border-b border-[#212836]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            {nav.map(([l, h]) => <a key={h} href={h} className="hover:text-[#E5A93C] transition-colors" data-testid={`nav-${l.toLowerCase()}`}>{l}</a>)}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="sx-btn-ghost" data-testid="nav-login-button">Portal Login</Link>
            <Link to="/register" className="sx-btn-primary" data-testid="nav-cta-button">Request Audit</Link>
          </div>
          <button className="md:hidden text-slate-200" onClick={() => setMenuOpen(!menuOpen)} data-testid="mobile-menu-button">{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#212836] px-4 py-4 space-y-3 bg-[#06080C]">
            {nav.map(([l, h]) => <a key={h} href={h} className="block text-slate-300" onClick={() => setMenuOpen(false)}>{l}</a>)}
            <Link to="/login" className="sx-btn-secondary w-full">Portal Login</Link>
            <Link to="/register" className="sx-btn-primary w-full">Request Audit</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden sx-grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="sx-fade-up">
            <span className="sx-chip border-[#E5A93C]/30 text-[#E5A93C] mb-5"><Sparkles className="w-3.5 h-3.5" /> {cms.hero.eyebrow}</span>
            <h1 className="font-head text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">{cms.hero.title}</h1>
            <p className="text-base sm:text-lg text-slate-400 mt-5 max-w-xl">{cms.hero.subtitle}</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/register" className="sx-btn-primary text-base px-6 py-3" data-testid="hero-cta-button">{cms.hero.cta_primary} <ArrowRight className="w-4 h-4" /></Link>
              <a href="#sample" className="sx-btn-outline text-base px-6 py-3" data-testid="hero-secondary-button">{cms.hero.cta_secondary}</a>
            </div>
            <div className="flex gap-8 mt-12">
              {cms.hero.stats.map((s) => (
                <div key={s.label}><div className="font-mono text-2xl sm:text-3xl font-bold text-[#E5A93C]">{s.value}</div><div className="text-xs text-slate-500 mt-1">{s.label}</div></div>
              ))}
            </div>
          </div>
          <div className="relative sx-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="sx-card p-6 bg-gradient-to-br from-[#151B23] to-[#0D1117] border-[#E5A93C]/25">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-slate-500">Sample CX Scorecard</span>
                <span className="sx-chip bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Live</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative w-28 h-28">
                  <svg className="-rotate-90 w-28 h-28"><circle cx="56" cy="56" r="48" stroke="#212836" strokeWidth="9" fill="none" /><circle cx="56" cy="56" r="48" stroke="#E5A93C" strokeWidth="9" fill="none" strokeDasharray={301} strokeDashoffset={301 - 0.86 * 301} strokeLinecap="round" /></svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-3xl font-bold text-white">86</span><span className="text-[10px] text-emerald-400">Good</span></div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {[["Greeting", 92], ["Product Knowledge", 78], ["Cleanliness", 88], ["Upselling", 71]].map(([l, v]) => (
                    <div key={l}><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{l}</span><span className="font-mono text-slate-300">{v}</span></div><div className="h-1.5 rounded-full bg-[#212836]"><div className="h-full rounded-full bg-[#E5A93C]" style={{ width: `${v}%` }} /></div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-y border-[#212836] bg-[#0D1117]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="font-head text-2xl sm:text-3xl font-bold text-white text-center">{cms.problem.title}</h2>
          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {cms.problem.items.map((it, i) => (
              <div key={i} className="sx-card sx-card-hover p-6"><div className="w-10 h-10 rounded-lg bg-[#E5A93C]/10 text-[#E5A93C] flex items-center justify-center mb-4">{[<Eye />, <Target />, <TrendingUp />][i]}</div><h3 className="font-head font-semibold text-white">{it.title}</h3><p className="text-sm text-slate-400 mt-2">{it.body}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section id="methodology" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto"><span className="sx-eyebrow">How we work</span><h2 className="font-head text-2xl sm:text-4xl font-bold text-white mt-2">{cms.methodology.title}</h2></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {cms.methodology.items.map((it, i) => {
            const Icon = ICONS[i % ICONS.length];
            return <div key={i} className="sx-card sx-card-hover p-6"><div className="flex items-center gap-3 mb-3"><span className="font-mono text-[#E5A93C] text-sm">0{i + 1}</span><Icon className="w-5 h-5 text-[#E5A93C]" /></div><h3 className="font-head font-semibold text-white">{it.title}</h3><p className="text-sm text-slate-400 mt-2">{it.body}</p></div>;
          })}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-y border-[#212836] bg-[#0D1117]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h2 className="font-head text-2xl sm:text-4xl font-bold text-white text-center">Core Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {["Mystery Shopping", "Customer Experience Audit", "SOP Compliance Audit", "Customer Journey Evaluation", "Multi-Outlet Benchmarking", "Competitor Benchmark", "Re-Audit", "Operational Findings", "Performance Comparison"].map((s, i) => (
              <div key={s} className="sx-card sx-card-hover p-5 flex items-center gap-3"><div className="w-8 h-8 rounded-md bg-[#E5A93C]/10 text-[#E5A93C] flex items-center justify-center">{[<FileSearch className="w-4 h-4" />, <ShieldCheck className="w-4 h-4" />, <ClipboardCheck className="w-4 h-4" />][i % 3]}</div><span className="text-sm font-medium text-slate-200">{s}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="font-head text-2xl sm:text-4xl font-bold text-white text-center">Built for service-led industries</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {cms.industries.map((ind) => (
            <div key={ind.name} className="relative rounded-xl overflow-hidden group h-56 border border-[#212836]"><img src={ind.img} alt={ind.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-[#06080C] via-[#06080C]/30 to-transparent" /><span className="absolute bottom-4 left-4 font-head font-semibold text-white">{ind.name}</span></div>
          ))}
        </div>
      </section>

      {/* SAMPLE + PACKAGES */}
      <section id="packages" className="border-y border-[#212836] bg-[#0D1117]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto"><span className="sx-eyebrow">Transparent pricing</span><h2 className="font-head text-2xl sm:text-4xl font-bold text-white mt-2">Choose your audit package</h2></div>
          <div className="grid lg:grid-cols-3 gap-6 mt-12 items-stretch">
            {packages.map((p) => (
              <div key={p.id} className={`sx-card p-7 flex flex-col relative ${p.recommended ? "border-[#E5A93C]/50 shadow-[0_0_28px_rgba(229,169,60,0.12)]" : ""}`} data-testid={`package-${p.key}`}>
                {p.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 sx-chip bg-[#E5A93C] text-[#06080C] font-semibold">Most Recommended</span>}
                <h3 className="font-head text-xl font-bold text-white">{p.name}</h3>
                <p className="text-sm text-slate-400 mt-1 h-10">{p.tagline}</p>
                <div className="font-mono text-3xl font-bold text-[#E5A93C] mt-4">{formatIDR(p.price)}</div>
                <p className="text-xs text-slate-500 mt-1">{p.key === "performance" ? "from 3 outlets" : "per audit"}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {p.features.slice(0, 8).map((f) => <li key={f} className="flex gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />{f}</li>)}
                </ul>
                <Link to="/register" className={`mt-6 ${p.recommended ? "sx-btn-primary" : "sx-btn-secondary"} w-full`} data-testid={`select-${p.key}-button`}>Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="sample" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="font-head text-2xl sm:text-4xl font-bold text-white text-center">How it works</h2>
        <div className="grid sm:grid-cols-4 gap-5 mt-12">
          {cms.how_it_works.map((s) => (
            <div key={s.step} className="sx-card p-6 text-center"><div className="w-11 h-11 rounded-full bg-[#E5A93C] text-[#06080C] font-head font-bold flex items-center justify-center mx-auto mb-4">{s.step}</div><h3 className="font-head font-semibold text-white">{s.title}</h3><p className="text-sm text-slate-400 mt-2">{s.body}</p></div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-y border-[#212836] bg-[#0D1117]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h2 className="font-head text-2xl sm:text-4xl font-bold text-white text-center">Trusted by operators</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {cms.testimonials.map((t, i) => (
              <div key={i} className="sx-card p-7"><div className="flex gap-1 mb-3">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-[#E5A93C] text-[#E5A93C]" />)}</div><p className="text-slate-200 text-lg leading-relaxed">"{t.quote}"</p><div className="mt-4 text-sm"><span className="font-semibold text-white">{t.name}</span><span className="text-slate-500"> · {t.role}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="font-head text-2xl sm:text-4xl font-bold text-white text-center mb-10">Frequently asked</h2>
        <div className="space-y-3">
          {cms.faq.map((q, i) => (
            <div key={i} className="sx-card overflow-hidden">
              <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left" data-testid={`faq-${i}`}><span className="font-medium text-slate-100">{q.q}</span><ChevronDown className={`w-4 h-4 text-[#E5A93C] transition-transform ${faqOpen === i ? "rotate-180" : ""}`} /></button>
              {faqOpen === i && <div className="px-5 pb-4 text-sm text-slate-400">{q.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="sx-card p-10 sm:p-14 text-center bg-gradient-to-br from-[#151B23] to-[#0D1117] border-[#E5A93C]/25">
          <h2 className="font-head text-2xl sm:text-4xl font-bold text-white">{cms.cta.title}</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">{cms.cta.subtitle}</p>
          <Link to="/register" className="sx-btn-primary text-base px-7 py-3 mt-8 inline-flex" data-testid="footer-cta-button">{cms.cta.button} <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#212836]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-600">Experience. Evidence. Insight. Improvement.</p>
          <div className="flex gap-4 text-sm text-slate-400">
            <Link to="/login" className="hover:text-[#E5A93C]">Client Login</Link>
            <Link to="/become-shopper" className="hover:text-[#E5A93C]">Shopper</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
