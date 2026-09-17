import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, SectionCard, StatusBadge } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { Cloud, CalendarDays, Mail, Link2, Unlink, CheckCircle2, AlertTriangle } from "lucide-react";

export default function Integrations() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const load = () => api.googleStatus().then(setS).catch(() => setS(false));

  useEffect(() => {
    load();
    const g = params.get("google");
    if (g === "connected") toast.success("Google Drive & Calendar connected");
    if (g === "error") toast.error(`Google connection failed: ${params.get("reason") || "unknown"}`);
    if (g) setParams({}, { replace: true });
  }, []);

  const connect = async () => {
    setBusy(true);
    try { const r = await api.googleConnect(); window.location.href = r.authorization_url; }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); setBusy(false); }
  };
  const disconnect = async () => {
    if (!window.confirm("Disconnect Google? Evidence will fall back to local storage and bookings to the internal calendar.")) return;
    setBusy(true);
    try { await api.googleDisconnect(); toast.success("Google disconnected"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setBusy(false); }
  };

  if (s === null) return <Loading />;
  if (!s) return <div className="text-slate-400">Failed to load integrations.</div>;

  return (
    <div className="sx-fade-up">
      <PageHeader title="Integrations" subtitle="Connect external services that power evidence storage, scheduling and alerts." testid="admin-integrations" />
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Google Workspace" subtitle="Drive (evidence storage) + Calendar (consultation bookings)" testid="google-card"
          right={<StatusBadge status={s.connected ? "connected" : s.configured ? "not_connected" : "not_configured"} />}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <Cloud className="w-5 h-5 text-[#E5A93C] shrink-0 mt-0.5" />
              <div><div className="text-slate-200">Google Drive</div><div className="text-xs text-slate-500">Shopper photos & receipts are uploaded to the folder <span className="font-mono text-slate-300">SilentCX Evidence/&lt;Audit ID&gt;</span> in the connected account. Falls back to local server storage when disconnected.</div></div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <CalendarDays className="w-5 h-5 text-[#E5A93C] shrink-0 mt-0.5" />
              <div><div className="text-slate-200">Google Calendar</div><div className="text-xs text-slate-500">Client bookings check your free/busy time and create an event with a Google Meet link; the client is invited by email.</div></div>
            </div>
            <div className="rounded-lg bg-[#151B23]/60 p-4 text-sm" data-testid="google-status">
              {s.connected ? (
                <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Connected as <span className="font-mono text-slate-200">{s.account}</span><span className="text-slate-500 text-xs">· since {formatDate(s.connected_at)}</span></div>
              ) : s.configured ? (
                <div className="flex items-center gap-2 text-amber-400"><AlertTriangle className="w-4 h-4" /> Credentials configured — not connected yet.</div>
              ) : (
                <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-4 h-4" /> GOOGLE_CLIENT_ID / SECRET missing on server.</div>
              )}
              <div className="text-[11px] text-slate-600 mt-2 font-mono break-all">Redirect URI: {s.redirect_uri}</div>
            </div>
            <div className="flex gap-2">
              {s.connected
                ? <button className="sx-btn-secondary" onClick={disconnect} disabled={busy} data-testid="google-disconnect-button"><Unlink className="w-4 h-4" /> Disconnect</button>
                : <button className="sx-btn-primary" onClick={connect} disabled={busy || !s.configured} data-testid="google-connect-button"><Link2 className="w-4 h-4" /> Connect Google Account</button>}
              {s.connected && <button className="sx-btn-outline" onClick={connect} disabled={busy} data-testid="google-reconnect-button">Reconnect</button>}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Email Alerts" subtitle="Report publications, revision requests, bookings" testid="email-card"
          right={<StatusBadge status={s.email_provider === "resend" ? "active" : "mock"} />}>
          <div className="flex items-start gap-3 text-sm mb-4">
            <Mail className="w-5 h-5 text-[#E5A93C] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500">In-app notifications are live for all roles. Email delivery is currently <span className="text-amber-400 font-medium">MOCKED</span> — every email is logged below. Add <span className="font-mono text-slate-300">RESEND_API_KEY</span> to enable real delivery.</div>
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Recent email log ({s.email_log.length})</div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto" data-testid="email-log">
            {s.email_log.length === 0 ? <div className="text-sm text-slate-600 py-4 text-center">No emails logged yet.</div> : s.email_log.map((e) => (
              <div key={e.id} className="p-3 rounded-lg bg-[#151B23]/50 text-xs" data-testid={`email-${e.id}`}>
                <div className="flex justify-between gap-2"><span className="text-slate-200 truncate">{e.subject}</span><span className="text-slate-600 shrink-0">{formatDate(e.created_at)}</span></div>
                <div className="text-slate-500 mt-0.5">to {e.to} · <span className="uppercase">{e.kind}</span></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
