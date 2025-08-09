import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/auth/AuthProvider";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import LoginPage from "@/react-app/pages/Login";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import Dashboard from "@/react-app/pages/Dashboard";
import Clients from "@/react-app/pages/Clients";
import Matters from "@/react-app/pages/Matters";
import MatterDetail from "@/react-app/pages/MatterDetail";
import Calendar from "@/react-app/pages/Calendar";
import Deadlines from "@/react-app/pages/Deadlines";
import NewMatter from "@/react-app/pages/NewMatter";
import NewClient from "@/react-app/pages/NewClient";
import Documents from "@/react-app/pages/Documents";
import Billing from "@/react-app/pages/Billing";
import IntakeForm from "@/react-app/pages/IntakeForm";
import CriminalIntakeForm from "@/react-app/pages/CriminalIntakeForm";
import ClientPortal from "@/react-app/pages/ClientPortal";
import ClientPortalLogin from "@/react-app/pages/ClientPortalLogin";
import TimeEntry from "@/react-app/pages/TimeEntry";
import CreateInvoice from "@/react-app/pages/CreateInvoice";
import InvoiceDetail from "@/react-app/pages/InvoiceDetail";
import Settings from "@/react-app/pages/Settings";
import GenerateDocument from "@/react-app/pages/GenerateDocument";
import UploadDocument from "@/react-app/pages/UploadDocument";
import NewTemplate from "@/react-app/pages/NewTemplate";
import DocumentDetail from "@/react-app/pages/DocumentDetail";
import Communications from "@/react-app/pages/Communications";
import NewDeadline from "@/react-app/pages/NewDeadline";
import NewHearing from "@/react-app/pages/NewHearing";
import ClientDetail from "@/react-app/pages/ClientDetail";
import DeadlineDetail from "@/react-app/pages/DeadlineDetail";
import ClientBalances from "@/react-app/pages/ClientBalances";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/intake" element={<IntakeForm />} />
          <Route path="/intake/new" element={<IntakeForm />} />
          <Route path="/intake/criminal" element={<CriminalIntakeForm />} />
          <Route path="/client-portal" element={<ClientPortalLogin />} />
          <Route path="/client-portal/:clientId" element={<ClientPortal />} />
          <Route path="/billing/time/new" element={<ProtectedRoute><TimeEntry /></ProtectedRoute>} />
          <Route path="/billing/invoice/new" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
          <Route path="/billing/invoice/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/documents/generate" element={<ProtectedRoute><GenerateDocument /></ProtectedRoute>} />
          <Route path="/documents/upload" element={<ProtectedRoute><UploadDocument /></ProtectedRoute>} />
          <Route path="/documents/templates/new" element={<ProtectedRoute><NewTemplate /></ProtectedRoute>} />
          <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
          <Route path="/communications" element={<ProtectedRoute><Communications /></ProtectedRoute>} />
          <Route path="/deadlines/new" element={<ProtectedRoute><NewDeadline /></ProtectedRoute>} />
          <Route path="/deadlines/:id" element={<ProtectedRoute><DeadlineDetail /></ProtectedRoute>} />
          <Route path="/hearings/new" element={<ProtectedRoute><NewHearing /></ProtectedRoute>} />
          <Route path="/client-balances" element={<ProtectedRoute><ClientBalances /></ProtectedRoute>} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="matters" element={<Matters />} />
            <Route path="matters/:id" element={<MatterDetail />} />
            <Route path="matters/new" element={<NewMatter />} />
            <Route path="clients/new" element={<NewClient />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="deadlines" element={<Deadlines />} />
            <Route path="documents" element={<Documents />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
