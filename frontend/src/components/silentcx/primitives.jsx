import React from "react";
import { Link } from "react-router-dom";
import { scoreRating, severityClass, cls, statusLabel } from "../../lib/format";
import { Loader2, Inbox, AlertTriangle } from "lucide-react";

export function Logo({ variant = "dark", className = "", showTag = false, to = "/" }) {
  const light = variant === "light";
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/silentcx-mark.png" alt="SilentCX" className="w-9 h-9 object-contain shrink-0" style={{ filter: "drop-shadow(0 0 10px rgba(229,169,60,0.25))" }} />
      <span className="leading-none">
        <span className={`font-head font-extrabold text-xl tracking-tight ${light ? "text-[#0B0F17]" : "text-white"}`}>Silent</span>
        <span className="font-head font-extrabold text-xl tracking-tight text-[#E5A93C]">CX</span>
        {showTag && <span className="block text-[9px] tracking-[0.18em] text-slate-500 mt-0.5 uppercase">Experience · Evidence · Insight</span>}
      </span>
    </span>
  );
  return to ? <Link to={to} data-testid="logo-link">{inner}</Link> : inner;
}

export function PageHeader({ title, subtitle, action, testid }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" data-testid={testid}>
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = "gold", testid }) {
  const toneMap = {
    gold: "text-[#E5A93C]", green: "text-emerald-400", red: "text-red-400",
    blue: "text-sky-400", slate: "text-slate-300",
  };
  return (
    <div className="sx-card sx-card-hover p-5 flex flex-col justify-between" data-testid={testid}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${toneMap[tone]}`} />}
      </div>
      <div className="mt-3 font-mono text-2xl sm:text-3xl font-bold text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export function ScoreDial({ score, size = 132, label = "Overall CX Score" }) {
  const r = scoreRating(score);
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score || 0));
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center" data-testid="score-dial">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#212836" strokeWidth="10" fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={r.hex} strokeWidth="10" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-white">{score ?? "—"}</span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: r.hex }}>{r.label}</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 mt-2">{label}</span>
    </div>
  );
}

export function ScoreBadge({ score }) {
  const r = scoreRating(score);
  return <span className={`sx-chip ${r.cls}`}><span className="font-mono font-semibold">{score ?? "—"}</span> {r.label}</span>;
}

export function SeverityBadge({ level }) {
  return <span className={`sx-chip uppercase tracking-wider text-[10px] font-semibold ${severityClass[level] || severityClass.low}`}>{level}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`sx-chip ${cls(status)}`}>{statusLabel(status)}</span>;
}

export function SectionCard({ title, subtitle, right, children, className = "", testid }) {
  return (
    <section className={`sx-card ${className}`} data-testid={testid}>
      {(title || right) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#212836]">
          <div>
            {title && <h3 className="font-head font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", body, action, testid }) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-[#212836] rounded-xl bg-[#0D1117]/50" data-testid={testid || "empty-state"}>
      <div className="w-12 h-12 rounded-full bg-[#151B23] border border-[#212836] text-[#E5A93C] flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-head font-semibold text-slate-200">{title}</h4>
      {body && <p className="text-sm text-slate-500 mt-1 max-w-sm">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500" data-testid="loading-state">
      <Loader2 className="w-6 h-6 animate-spin text-[#E5A93C] mb-3" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="p-10 text-center border border-dashed border-red-500/30 rounded-xl bg-red-500/5" data-testid="error-state">
      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-3" />
      <p className="text-sm text-slate-300">{message}</p>
      {onRetry && <button className="sx-btn-outline mt-4" onClick={onRetry} data-testid="error-retry">Retry</button>}
    </div>
  );
}

export function ProgressBar({ value, hex = "#E5A93C" }) {
  return (
    <div className="w-full h-2 rounded-full bg-[#212836] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: hex, transition: "width 0.8s ease" }} />
    </div>
  );
}
