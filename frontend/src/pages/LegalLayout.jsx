import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/silentcx/primitives";
import { ArrowLeft } from "lucide-react";

export function LegalLayout({ title, updated, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="bg-[#06080C] text-slate-300 min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#06080C]/85 border-b border-[#212836]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <Link to="/" className="sx-btn-ghost" data-testid="legal-home"><ArrowLeft className="w-4 h-4" /> Beranda</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="font-head text-3xl sm:text-4xl font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">Terakhir diperbarui: {updated}</p>
        <div className="mt-10 space-y-8 sx-legal">{children}</div>
        <div className="mt-14 pt-8 border-t border-[#212836] text-sm text-slate-500">
          Pertanyaan? Hubungi kami di <a href="mailto:hello@silentcx.id" className="text-[#E5A93C]">hello@silentcx.id</a>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }) {
  return (
    <section>
      <h2 className="font-head text-lg font-semibold text-white mb-2">{heading}</h2>
      <div className="text-sm text-slate-400 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
