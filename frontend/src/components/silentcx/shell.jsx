import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Logo } from "./primitives";
import { Menu, X, LogOut, Bell } from "lucide-react";

export function DashboardShell({ nav, children, title, notifications = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const doLogout = () => { logout(); navigate("/login"); };

  const NavItems = ({ onClick }) => (
    <nav className="space-y-6">
      {nav.map((group) => (
        <div key={group.label}>
          <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 mb-1.5">{group.label}</div>
          <div className="space-y-0.5">
            {group.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} onClick={onClick}
                data-testid={`nav-${it.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-[#E5A93C]/10 text-[#E5A93C] font-medium" : "text-slate-400 hover:text-slate-100 hover:bg-[#151B23]"}`}>
                <it.icon className="w-4 h-4 shrink-0" /> {it.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#06080C] flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#212836] bg-[#0D1117] fixed inset-y-0">
        <div className="h-16 flex items-center px-5 border-b border-[#212836]"><Logo /></div>
        <div className="flex-1 overflow-y-auto p-4"><NavItems /></div>
        <div className="p-4 border-t border-[#212836]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#E5A93C]/15 text-[#E5A93C] flex items-center justify-center font-semibold text-sm">{user?.name?.[0]}</div>
            <div className="min-w-0"><div className="text-sm text-slate-200 truncate">{user?.name}</div><div className="text-xs text-slate-600 capitalize">{user?.role}</div></div>
          </div>
          <button className="sx-btn-ghost w-full justify-start" onClick={doLogout} data-testid="logout-button"><LogOut className="w-4 h-4" /> Log out</button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-[#0D1117] border-r border-[#212836] flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#212836]"><Logo /><button onClick={() => setOpen(false)}><X className="text-slate-400" /></button></div>
            <div className="flex-1 overflow-y-auto p-4"><NavItems onClick={() => setOpen(false)} /></div>
            <div className="p-4 border-t border-[#212836]"><button className="sx-btn-ghost w-full justify-start" onClick={doLogout}><LogOut className="w-4 h-4" /> Log out</button></div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="h-16 sticky top-0 z-30 backdrop-blur-xl bg-[#06080C]/85 border-b border-[#212836] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-300" onClick={() => setOpen(true)} data-testid="open-sidebar"><Menu /></button>
            <span className="font-head font-semibold text-white">{title}</span>
          </div>
          <div className="relative">
            <button className="relative text-slate-400 hover:text-slate-100 p-2" onClick={() => setBell(!bell)} data-testid="notifications-button">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E5A93C] text-[#06080C] text-[10px] font-bold flex items-center justify-center">{unread}</span>}
            </button>
            {bell && (
              <div className="absolute right-0 mt-2 w-80 sx-card p-2 z-50 max-h-96 overflow-y-auto" data-testid="notifications-panel">
                {notifications.length === 0 ? <div className="p-4 text-sm text-slate-500 text-center">No notifications</div> :
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-lg ${n.read ? "" : "bg-[#151B23]"} ${n.link ? "cursor-pointer hover:bg-[#1F2734]" : ""}`}
                      onClick={() => { if (n.link) { setBell(false); navigate(n.link); } }} data-testid={`notification-${n.id}`}>
                      <div className="text-sm font-medium text-slate-200">{n.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
