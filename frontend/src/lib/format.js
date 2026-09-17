export function formatIDR(n) {
  if (n == null) return "—";
  return "IDR " + Number(n).toLocaleString("id-ID");
}

export function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

export function scoreRating(s) {
  if (s == null) return { label: "No Data", cls: "bg-slate-500/10 text-slate-400 border-slate-500/30", hex: "#64748B" };
  if (s >= 90) return { label: "Excellent", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", hex: "#10B981" };
  if (s >= 80) return { label: "Good", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30", hex: "#F59E0B" };
  if (s >= 70) return { label: "Needs Attention", cls: "bg-orange-500/10 text-orange-400 border-orange-500/30", hex: "#F97316" };
  if (s >= 60) return { label: "Poor", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30", hex: "#F43F5E" };
  return { label: "Critical", cls: "bg-red-600/15 text-red-400 border-red-600/40", hex: "#DC2626" };
}

export const severityClass = {
  critical: "bg-red-500/10 text-red-400 border-red-500/40",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  low: "bg-slate-500/10 text-slate-300 border-slate-500/30",
};

export function statusLabel(s) {
  if (!s) return "—";
  return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export const statusClass = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  unpaid: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  partial: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  report_published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  awaiting_review: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  under_review: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  revision_required: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  suspended: "bg-red-500/10 text-red-400 border-red-500/30",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  upcoming: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  pending_submission: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  scheduled: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  requested: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  default: "bg-slate-500/10 text-slate-300 border-slate-500/30",
};

export const cls = (s) => statusClass[s] || statusClass.default;
