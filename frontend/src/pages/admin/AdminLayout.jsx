import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/silentcx/shell";
import {
  LayoutDashboard, Users, Building2, Store, UserCheck, ShieldCheck, ClipboardList,
  FolderKanban, FileQuestion, LayoutTemplate, Tags, FileBarChart, Package, PlusCircle,
  Receipt, Globe, ClipboardCheck, CalendarClock, Plug,
} from "lucide-react";

const nav = [
  { label: "Dashboard", items: [{ to: "/admin", end: true, label: "Cockpit", icon: LayoutDashboard }] },
  { label: "Clients", items: [
    { to: "/admin/clients", label: "Clients", icon: Users },
    { to: "/admin/companies", label: "Companies", icon: Building2 },
    { to: "/admin/outlets", label: "Outlets", icon: Store },
    { to: "/admin/consultations", label: "Consultations", icon: CalendarClock },
  ]},
  { label: "Shoppers", items: [
    { to: "/admin/applications", label: "Applications", icon: UserCheck },
    { to: "/admin/shoppers", label: "Verified Shoppers", icon: ShieldCheck },
    { to: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  ]},
  { label: "Audits", items: [
    { to: "/admin/projects", label: "Audit Projects", icon: FolderKanban },
    { to: "/admin/qc", label: "QC & Submissions", icon: ClipboardCheck },
    { to: "/admin/questionnaires", label: "Questionnaires", icon: FileQuestion },
    { to: "/admin/templates", label: "Templates", icon: LayoutTemplate },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  ]},
  { label: "Commercial", items: [
    { to: "/admin/packages", label: "Packages", icon: Package },
    { to: "/admin/addons", label: "Add-Ons", icon: PlusCircle },
    { to: "/admin/invoices", label: "Invoices", icon: Receipt },
  ]},
  { label: "Website & System", items: [
    { to: "/admin/cms", label: "CMS", icon: Globe },
    { to: "/admin/integrations", label: "Integrations", icon: Plug },
  ]},
];

export default function AdminLayout() {
  const [notifications, setNotifications] = useState([]);
  const loc = useLocation();
  useEffect(() => { api.adminNotifications().then(setNotifications).catch(() => {}); }, [loc.pathname]);
  return (
    <DashboardShell nav={nav} title="Admin Console" notifications={notifications}>
      <Outlet />
    </DashboardShell>
  );
}
