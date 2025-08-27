// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// PAGES
import Dashboard from "@/pages/Dashboard";                 // keep your existing file
import Dashboards from "@/pages/Dashboards";               // NEW (below)
import DashboardCustomizer from "@/pages/DashboardCustomizer"; // NEW (below)

// SHARED LAYOUT (if you have one)
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* HOME: point to your existing Dashboard page, but we’ll title it “Home” in-page */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardHeader title="Home" />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* New “Dashboards” hub page */}
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
