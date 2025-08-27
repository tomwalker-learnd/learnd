// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";
import Dashboards from "@/pages/Dashboards";
import DashboardCustomizer from "@/pages/DashboardCustomizer";
import Auth from "@/pages/Auth"; // <-- ensure this exists

// GLOBAL TOP NAV
import AppHeader from "@/components/AppHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default function App() {
  const { loading, user } = useAuth();

  return (
    <Router>
      {/* Render header only when it's safe; guard against null user inside AppHeader as well */}
      {!loading && <AppHeader />}

      <Routes>
        {/* Public auth route */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected */}
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
    </Router>
  );
}
