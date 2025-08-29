// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import LearndAI from "@/components/LearndAI"; // <-- Floating AI bubble

// PAGES
import Home from "@/pages/Home";
import Dashboards from "@/pages/Dashboards";
import Lessons from "@/pages/Lessons";
import Analytics from "@/pages/Analytics";
import DashboardCustomizer from "@/pages/DashboardCustomizer";
import SubmitWizard from "@/pages/SubmitWizard";
import Submit from "@/pages/Submit";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function Shell() {
  const location = useLocation();

  // Hide header & LearndAI on auth-related screens
  const isAuthScreen =
    /^\/auth(\/|$)/i.test(location.pathname) ||
    /^\/reset/i.test(location.pathname) ||
    /^\/reset-password/i.test(location.pathname);

  return (
    <>
      {!isAuthScreen && <AppHeader />}

      <div className="min-h-[calc(100vh-56px)]">
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboards"
            element={
              <ProtectedRoute>
                <Dashboards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons"
            element={
              <ProtectedRoute>
                <Lessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-customizer"
            element={
              <ProtectedRoute>
                <DashboardCustomizer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <Submit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-wizard"
            element={
              <ProtectedRoute>
                <SubmitWizard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Floating LearndAI bubble (hidden on auth/reset screens) */}
      {!isAuthScreen && (
        <div className="z-[2000]">
          <LearndAI context={{ from: "global" }} />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}
