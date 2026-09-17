import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useClient } from "./ClientLayout";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, StatusBadge, SectionCard } from "@/components/silentcx/primitives";
import { CalendarClock, Video, ExternalLink, XCircle, Loader2, ChevronLeft, ChevronRight, CalendarCheck2 } from "lucide-react";

const fmtDate = (d) => d.toISOString().slice(0, 10);
const fmtWIB = (iso) => new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";

export default function Consultation() {
  const { data, reload } = useClient();
  const proj = data.projects.find((p) => (p.entitlements || []).includes("consultation")) || data.projects[0];
  const [list, setList] = useState(data.consultations || []);
  const [date, setDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return fmtDate(d); });
  const [slots, setSlots] = useState(null);
  const [gcal, setGcal] = useState(false);
  const [pick, setPick] = useState(null);
  const [topic, setTopic] = useState("CX Strategy Consultation");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSlots(null); setPick(null); api.consultationSlots(date).then((r) => { setSlots(r.slots); setGcal(r.google_calendar); }).catch(() => setSlots([])); }, [date]);

  const shift = (n) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(fmtDate(d)); };

  const book = async () => {
    if (!pick) return toast.error("Pick a time slot first");
    setBusy(true);
    try {
      const r = await api.bookConsultation({ project_id: proj.project_id, start: pick.start, topic, notes });
      setList((p) => [r.consultation, ...p]); setPick(null); reload();
      toast.success(r.consultation.provider === "google_calendar" ? "Booked! Calendar invite sent to your email." : "Consultation booked");
      api.consultationSlots(date).then((x) => setSlots(x.slots));
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setBusy(false); }
  };
  const cancel = async (c) => {
    if (!window.confirm("Cancel this consultation?")) return;
    try { await api.cancelConsultation(c.id); setList((p) => p.map((x) => (x.id === c.id ? { ...x, status: "cancelled" } : x))); toast.success("Cancelled"); reload(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const upcoming = list.filter((c) => c.status === "scheduled" && c.scheduled_at && new Date(c.scheduled_at) > new Date());
  const past = list.filter((c) => !upcoming.includes(c));

  return (
    <div className="sx-fade-up">
      <PageHeader title="Consultation" subtitle="Book a 60-minute strategy session with your CX consultant." testid="client-consultation" />
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <SectionCard title="Pick a slot" subtitle={gcal ? "Availability synced with consultant's Google Calendar" : "Mon–Fri, 09:00–17:00 WIB"} testid="slot-picker">
          <div className="flex items-center gap-2 mb-4">
            <button className="sx-btn-ghost p-2" onClick={() => shift(-1)} data-testid="date-prev"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" className="sx-input w-auto" value={date} min={fmtDate(new Date())} onChange={(e) => setDate(e.target.value)} data-testid="date-input" />
            <button className="sx-btn-ghost p-2" onClick={() => shift(1)} data-testid="date-next"><ChevronRight className="w-4 h-4" /></button>
            <span className="text-xs text-slate-500 ml-2">{new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
          {slots === null ? <div className="py-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin inline" /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="slot-grid">
              {slots.map((s) => (
                <button key={s.start} disabled={!s.available} onClick={() => setPick(s)}
                  className={`rounded-lg px-3 py-3 text-sm font-mono border transition-colors ${pick?.start === s.start ? "bg-[#E5A93C] text-[#06080C] border-transparent" : s.available ? "border-[#212836] text-slate-200 hover:border-[#E5A93C]/50" : "border-[#212836]/40 text-slate-600 line-through cursor-not-allowed"}`}
                  data-testid={`slot-${s.start.slice(11, 13)}`}>{s.label.split(" – ")[0]}</button>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div><label className="sx-label">Topic</label><input className="sx-input" value={topic} onChange={(e) => setTopic(e.target.value)} data-testid="topic-input" /></div>
            <div><label className="sx-label">Notes for consultant (optional)</label><input className="sx-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What would you like to focus on?" data-testid="notes-input" /></div>
          </div>
          <button className="sx-btn-primary w-full sm:w-auto mt-4" onClick={book} disabled={busy || !pick} data-testid="book-consultation-button">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck2 className="w-4 h-4" />} {pick ? `Book ${pick.label}` : "Select a slot"}
          </button>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title={`Upcoming (${upcoming.length})`} testid="upcoming-consultations">
            {upcoming.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No upcoming sessions.</p> : upcoming.map((c) => (
              <div key={c.id} className="p-4 rounded-lg bg-[#151B23]/50 mb-2" data-testid={`consultation-${c.id}`}>
                <div className="flex justify-between gap-2"><div className="text-sm text-slate-100">{c.topic}</div><StatusBadge status={c.status} /></div>
                <div className="text-xs text-[#E5A93C] mt-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {fmtWIB(c.scheduled_at)}</div>
                <div className="flex gap-2 mt-3">
                  {c.meet_link && <a href={c.meet_link} target="_blank" rel="noreferrer" className="sx-chip text-emerald-400 border-[#212836]" data-testid={`meet-${c.id}`}><Video className="w-3.5 h-3.5" /> Google Meet</a>}
                  {c.event_link && <a href={c.event_link} target="_blank" rel="noreferrer" className="sx-chip text-slate-300 border-[#212836]"><ExternalLink className="w-3.5 h-3.5" /> Calendar</a>}
                  <button onClick={() => cancel(c)} className="sx-chip text-red-400 border-[#212836] ml-auto" data-testid={`cancel-${c.id}`}><XCircle className="w-3.5 h-3.5" /> Cancel</button>
                </div>
              </div>
            ))}
          </SectionCard>
          {past.length > 0 && (
            <SectionCard title="History">
              {past.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#212836]/50 last:border-0 text-sm" data-testid={`consultation-${c.id}`}>
                  <div><div className="text-slate-300">{c.topic}</div><div className="text-xs text-slate-500">{c.scheduled_at ? fmtWIB(c.scheduled_at) : "Not scheduled"}</div></div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
