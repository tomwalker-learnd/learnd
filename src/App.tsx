// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";
import Dashboards from "@/pages/Dashboards";
import DashboardCustomizer from "@/pages/DashboardCustomizer";
import Lessons from "@/pages/Lessons";
import Analytics from "@/pages/Analytics";
import Auth from "@/pages/Auth";

// GLOBAL TOP NAV
import AppHeader from "@/components/AppHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function Root() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
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
          {/* Keep the customizer page reachable via button, not via nav */}
          <Route
            path="/dashboards/customize"
            element={
              <ProtectedRoute>
                <DashboardCustomizer />
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
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Root />
    </Router>
  );
}
