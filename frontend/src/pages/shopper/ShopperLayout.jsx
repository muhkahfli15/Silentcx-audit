import React, { useEffect, useState, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Logo, Loading, ErrorState } from "@/components/silentcx/primitives";
import { Home, ClipboardList, Send, Wallet, User, LogOut } from "lucide-react";

export const useShopper = () => useOutletContext();

const TABS = [
  { to: "/shopper", end: true, label: "Home", icon: Home },
  { to: "/shopper/assignments", label: "Tasks", icon: ClipboardList },
  { to: "/shopper/submissions", label: "Submissions", icon: Send },
  { to: "/shopper/payments", label: "Payments", icon: Wallet },
  { to: "/shopper/profile", label: "Profile", icon: User },
];

export default function ShopperLayout() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(() => { setErr(null); api.shopperHome().then(setData).catch(() => setErr("Failed to load")); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#06080C]">
      <div className="max-w-md mx-auto min-h-screen flex flex-col border-x border-[#212836] relative">
        <header className="h-14 flex items-center justify-between px-4 border-b border-[#212836] sticky top-0 bg-[#06080C]/90 backdrop-blur-xl z-20">
          <Logo to="/shopper" />
          <button onClick={() => { logout(); nav("/login"); }} className="text-slate-400" data-testid="shopper-logout"><LogOut className="w-5 h-5" /></button>
        </header>
        <main className="flex-1 px-4 py-5 pb-24">
          {err ? <ErrorState message={err} onRetry={load} /> : !data ? <Loading /> : <Outlet context={{ data, reload: load }} />}
        </main>
        <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto backdrop-blur-xl bg-[#0D1117]/95 border-t border-[#212836] grid grid-cols-5 z-20">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} data-testid={`shopper-tab-${t.label.toLowerCase()}`}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[10px] ${isActive ? "text-[#E5A93C]" : "text-slate-500"}`}>
              <t.icon className="w-5 h-5" /> {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
