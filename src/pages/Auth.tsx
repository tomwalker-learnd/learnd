// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";                   // Home
import Dashboards from "@/pages/Dashboards";                 // Hub
import DashboardCustomizer from "@/pages/DashboardCustomizer"; // Builder
import Auth from "@/pages/Auth";                             // Auth page

// GLOBAL TOP NAV
import AppHeader from "@/components/AppHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <AppHeader />

      <Routes>
        {/* Public auth routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />

        {/* Protected app */}
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
