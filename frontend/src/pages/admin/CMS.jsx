import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, SectionCard } from "@/components/silentcx/primitives";
import { Save, Eye, ExternalLink } from "lucide-react";

export default function CMS() {
  const [cms, setCms] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.cms().then(setCms); }, []);
  if (!cms) return <Loading />;

  const save = async () => {
    setSaving(true);
    try { await api.updateCms(cms); toast.success("Landing page published"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setSaving(false); }
  };

  const setHero = (k, v) => setCms({ ...cms, hero: { ...cms.hero, [k]: v } });
  const setCta = (k, v) => setCms({ ...cms, cta: { ...cms.cta, [k]: v } });

  return (
    <div className="sx-fade-up">
      <PageHeader title="Website CMS" subtitle="Edit landing page content. Changes publish instantly." testid="admin-cms"
        action={<div className="flex gap-2"><a href="/" target="_blank" rel="noreferrer" className="sx-btn-secondary"><ExternalLink className="w-4 h-4" /> Preview Site</a><button className="sx-btn-primary" onClick={save} disabled={saving} data-testid="cms-publish-button"><Save className="w-4 h-4" /> {saving ? "Publishing…" : "Publish"}</button></div>} />

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Hero Section">
          <div className="space-y-3">
            <Field label="Eyebrow" v={cms.hero.eyebrow} on={(v) => setHero("eyebrow", v)} tid="cms-hero-eyebrow" />
            <Field label="Title" v={cms.hero.title} on={(v) => setHero("title", v)} tid="cms-hero-title" />
            <Field label="Subtitle" v={cms.hero.subtitle} on={(v) => setHero("subtitle", v)} textarea tid="cms-hero-subtitle" />
            <Field label="Primary CTA" v={cms.hero.cta_primary} on={(v) => setHero("cta_primary", v)} />
            <Field label="Secondary CTA" v={cms.hero.cta_secondary} on={(v) => setHero("cta_secondary", v)} />
          </div>
        </SectionCard>

        <SectionCard title="Hero Stats">
          <div className="space-y-3">
            {cms.hero.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <Field label={`Value ${i + 1}`} v={s.value} on={(v) => { const st = [...cms.hero.stats]; st[i] = { ...st[i], value: v }; setHero("stats", st); }} />
                <Field label="Label" v={s.label} on={(v) => { const st = [...cms.hero.stats]; st[i] = { ...st[i], label: v }; setHero("stats", st); }} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Problem Section">
          <Field label="Title" v={cms.problem.title} on={(v) => setCms({ ...cms, problem: { ...cms.problem, title: v } })} />
          <div className="mt-3 space-y-3">{cms.problem.items.map((it, i) => (
            <div key={i} className="sx-card p-3 space-y-2"><Field label="Item Title" v={it.title} on={(v) => { const items = [...cms.problem.items]; items[i] = { ...items[i], title: v }; setCms({ ...cms, problem: { ...cms.problem, items } }); }} /><Field label="Body" v={it.body} on={(v) => { const items = [...cms.problem.items]; items[i] = { ...items[i], body: v }; setCms({ ...cms, problem: { ...cms.problem, items } }); }} /></div>
          ))}</div>
        </SectionCard>

        <SectionCard title="Final CTA Banner">
          <div className="space-y-3">
            <Field label="Title" v={cms.cta.title} on={(v) => setCta("title", v)} tid="cms-cta-title" />
            <Field label="Subtitle" v={cms.cta.subtitle} on={(v) => setCta("subtitle", v)} textarea />
            <Field label="Button" v={cms.cta.button} on={(v) => setCta("button", v)} />
          </div>
        </SectionCard>

        <SectionCard title="FAQ" className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-3">
            {cms.faq.map((q, i) => (
              <div key={i} className="sx-card p-3 space-y-2">
                <Field label="Question" v={q.q} on={(v) => { const faq = [...cms.faq]; faq[i] = { ...faq[i], q: v }; setCms({ ...cms, faq }); }} />
                <Field label="Answer" v={q.a} on={(v) => { const faq = [...cms.faq]; faq[i] = { ...faq[i], a: v }; setCms({ ...cms, faq }); }} textarea />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

const Field = ({ label, v, on, textarea, tid }) => (
  <div>
    <label className="sx-label">{label}</label>
    {textarea ? <textarea className="sx-input" rows="2" value={v} onChange={(e) => on(e.target.value)} data-testid={tid} /> : <input className="sx-input" value={v} onChange={(e) => on(e.target.value)} data-testid={tid} />}
  </div>
);
