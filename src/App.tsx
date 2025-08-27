// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";
import Dashboards from "@/pages/Dashboards";
import DashboardCustomizer from "@/pages/DashboardCustomizer";
import Auth from "@/pages/Auth"; // <-- your real auth page

// GLOBAL TOP NAV
import AppHeader from "@/components/AppHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Inner shell so we can use useLocation() under Router
function Root() {
  const { loading } = useAuth();
  const location = useLocation();
  const onAuthRoute = location.pathname.startsWith("/auth");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hide header on /auth; otherwise render after auth init */}
      {!onAuthRoute && !loading && <AppHeader />}

      <div className="flex-1">
        <Routes>
          {/* Public auth route */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes */}
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
          <Route
            path="/dashboards/customize"
            element={
              <ProtectedRoute>
                <DashboardCustomizer />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
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
