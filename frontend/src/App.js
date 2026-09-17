import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loading } from "@/components/silentcx/primitives";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ShopperRegister from "@/pages/ShopperRegister";
import Onboarding from "@/pages/Onboarding";

import ClientLayout from "@/pages/client/ClientLayout";
import ClientOverview from "@/pages/client/Overview";
import ClientAudits from "@/pages/client/Audits";
import AuditDetail from "@/pages/client/AuditDetail";
import ClientOutlets from "@/pages/client/Outlets";
import OutletDetail from "@/pages/client/OutletDetail";
import ClientReports from "@/pages/client/Reports";
import ReportView from "@/pages/client/ReportView";
import ClientFindings from "@/pages/client/Findings";
import ClientRecommendations from "@/pages/client/Recommendations";
import ClientBilling from "@/pages/client/Billing";
import ClientDocuments from "@/pages/client/Documents";
import ClientAccount from "@/pages/client/Account";
import Benchmark from "@/pages/client/Benchmark";
import Competitor from "@/pages/client/Competitor";
import ReAudit from "@/pages/client/ReAudit";
import Consultation from "@/pages/client/Consultation";

import ShopperLayout from "@/pages/shopper/ShopperLayout";
import ShopperHome from "@/pages/shopper/Home";
import ShopperAssignments from "@/pages/shopper/Assignments";
import AssignmentDetail from "@/pages/shopper/AssignmentDetail";
import AuditForm from "@/pages/shopper/AuditForm";
import ShopperSubmissions from "@/pages/shopper/Submissions";
import ShopperPayments from "@/pages/shopper/Payments";
import ShopperProfile from "@/pages/shopper/Profile";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminApplications from "@/pages/admin/Applications";
import AdminQC from "@/pages/admin/QC";
import AdminProjects from "@/pages/admin/Projects";
import AdminCMS from "@/pages/admin/CMS";
import AdminCatalog from "@/pages/admin/Catalog";
import AdminResource from "@/pages/admin/Resource";
import AdminQuestionnaires from "@/pages/admin/Questionnaires";
import AdminIntegrations from "@/pages/admin/Integrations";

export function homePath(user) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (user.role === "shopper") return "/shopper";
  if (user.role === "client" && !user.onboarding_complete) return "/onboarding";
  return "/app";
}

function Guard({ roles, children, allowIncompleteOnboarding }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user)} replace />;
  if (user.role === "client" && !user.onboarding_complete && !allowIncompleteOnboarding)
    return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (user) return <Navigate to={homePath(user)} replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/become-shopper" element={<PublicOnly><ShopperRegister /></PublicOnly>} />

          <Route path="/onboarding" element={<Guard roles={["client"]} allowIncompleteOnboarding><Onboarding /></Guard>} />

          <Route path="/app" element={<Guard roles={["client"]}><ClientLayout /></Guard>}>
            <Route index element={<ClientOverview />} />
            <Route path="audits" element={<ClientAudits />} />
            <Route path="audits/:id" element={<AuditDetail />} />
            <Route path="outlets" element={<ClientOutlets />} />
            <Route path="outlets/:id" element={<OutletDetail />} />
            <Route path="reports" element={<ClientReports />} />
            <Route path="reports/:id" element={<ReportView />} />
            <Route path="findings" element={<ClientFindings />} />
            <Route path="recommendations" element={<ClientRecommendations />} />
            <Route path="billing" element={<ClientBilling />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="account" element={<ClientAccount />} />
            <Route path="benchmark" element={<Benchmark />} />
            <Route path="competitor" element={<Competitor />} />
            <Route path="re-audit" element={<ReAudit />} />
            <Route path="consultation" element={<Consultation />} />
          </Route>

          <Route path="/shopper" element={<Guard roles={["shopper"]}><ShopperLayout /></Guard>}>
            <Route index element={<ShopperHome />} />
            <Route path="assignments" element={<ShopperAssignments />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
            <Route path="assignments/:id/audit" element={<AuditForm />} />
            <Route path="submissions" element={<ShopperSubmissions />} />
            <Route path="payments" element={<ShopperPayments />} />
            <Route path="profile" element={<ShopperProfile />} />
          </Route>

          <Route path="/admin" element={<Guard roles={["admin"]}><AdminLayout /></Guard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="qc" element={<AdminQC />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="reports" element={<AdminProjects />} />
            <Route path="cms" element={<AdminCMS />} />
            <Route path="packages" element={<AdminCatalog />} />
            <Route path="addons" element={<AdminCatalog />} />
            <Route path="clients" element={<AdminResource coll="clients" />} />
            <Route path="shoppers" element={<AdminResource coll="shoppers" />} />
            <Route path="companies" element={<AdminResource coll="companies" />} />
            <Route path="outlets" element={<AdminResource coll="outlets" />} />
            <Route path="assignments" element={<AdminResource coll="assignments" />} />
            <Route path="invoices" element={<AdminResource coll="invoices" />} />
            <Route path="questionnaires" element={<AdminQuestionnaires />} />
            <Route path="integrations" element={<AdminIntegrations />} />
            <Route path="consultations" element={<AdminResource coll="consultations" />} />
            <Route path="templates" element={<AdminResource coll="templates" />} />
            <Route path="categories" element={<AdminResource coll="categories" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
