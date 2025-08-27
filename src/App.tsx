// src/App.tsx (temporary safe version)
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// TEMP super-simple Auth page so /auth definitely exists
function AuthPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Sign in</h1>
      <p className="text-sm text-muted-foreground">Auth screen placeholder.</p>
    </div>
  );
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      {/* remove <AppHeader /> for the moment */}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* Keep your real Dashboard here */}
              <div className="p-6">Home OK</div>
            </ProtectedRoute>
          }
        />
        <Route path="/dashboards" element={<ProtectedRoute><div className="p-6">Dashboards OK</div></ProtectedRoute>} />
        <Route path="/dashboards/customize" element={<ProtectedRoute><div className="p-6">Customize OK</div></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
