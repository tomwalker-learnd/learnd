// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";                  // "Home"
import Dashboards from "@/pages/Dashboards";                // Hub
import DashboardCustomizer from "@/pages/DashboardCustomizer"; // Builder

// GLOBAL TOP NAV
import AppHeader from "@/components/AppHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      {/* Global top nav with compact avatar + links */}
      <AppHeader />

      <Routes>
        {/* HOME: Dashboard page acts as "Home" */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboards hub */}
        <Route
          path="/dashboards"
          element={
            <ProtectedRoute>
              <Dashboards />
            </ProtectedRoute>
          }
        />

        {/* Custom dashboard builder */}
        <Route
          path="/dashboards/customize"
          element={
            <ProtectedRoute>
              <DashboardCustomizer />
            </ProtectedRoute>
          }
        />

        {/* keep your other routes here */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
