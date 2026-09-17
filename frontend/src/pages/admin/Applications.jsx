import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { PageHeader, Loading, StatusBadge, EmptyState } from "@/components/silentcx/primitives";
import { formatDate } from "@/lib/format";
import { UserCheck, Check, X, Eye, RotateCcw, Ban } from "lucide-react";

const ACTIONS = [
  { key: "approve", label: "Approve", icon: Check, cls: "text-emerald-400" },
  { key: "review", label: "Review", icon: Eye, cls: "text-sky-400" },
  { key: "revision", label: "Revision", icon: RotateCcw, cls: "text-amber-400" },
  { key: "reject", label: "Reject", icon: X, cls: "text-red-400" },
  { key: "suspend", label: "Suspend", icon: Ban, cls: "text-red-400" },
];

export default function Applications() {
  const [apps, setApps] = useState(null);
  const load = () => api.adminList("applications").then(setApps);
  useEffect(() => { load(); }, []);
  if (!apps) return <Loading />;

  const act = async (id, action) => {
    try { await api.appAction(id, { action }); toast.success(`Application ${action}d`); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="sx-fade-up">
      <PageHeader title="Shopper Applications" subtitle="Review, verify and manage applicants." testid="admin-applications" />
      {apps.length === 0 ? <EmptyState icon={UserCheck} title="No applications" /> : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="sx-card p-5" data-testid={`application-${a.id}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-head font-semibold text-white">{a.name}</h3><StatusBadge status={a.status} /></div>
                  <p className="text-xs text-slate-500 mt-1">{a.email} · {a.whatsapp}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.city} · {a.occupation} · {a.preferred_industry} · Exp: {a.experience}</p>
                  <p className="text-xs text-slate-600 mt-1">Applied {formatDate(a.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  {ACTIONS.map((ac) => (
                    <button key={ac.key} onClick={() => act(a.id, ac.key)} className={`sx-chip border-[#212836] hover:border-current ${ac.cls}`} data-testid={`app-${ac.key}-${a.id}`}>
                      <ac.icon className="w-3.5 h-3.5" /> {ac.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
