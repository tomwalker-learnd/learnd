// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";
import Dashboards from "@/pages/Dashboards";
import DashboardCustomizer from "@/pages/DashboardCustomizer";
import Auth from "@/pages/Auth"; // ⬅️ add this import

// GLOBAL TOP NAV
import AppHeader from "@/components/AppHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show a tiny loader instead of "null" to avoid a blank page during auth init
  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  // If not logged in, go to /auth (which actually exists)
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      {/* Top nav can stay outside protected areas if it can handle no-user state */}
      <AppHeader />

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

        {/* Fallback: if unknown path, go home (which is protected) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
