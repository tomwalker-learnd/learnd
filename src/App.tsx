import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";

import AppHeader from "@/components/AppHeader";

import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Submit from "@/pages/Submit";
import SubmitWizard from "@/pages/SubmitWizard";
import Lessons from "@/pages/Lessons";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

// NEW: custom dashboards
import Builder from "@/pages/dashboards/Builder";
import SavedList from "@/pages/dashboards/SavedList";
import Viewer from "@/pages/dashboards/Viewer";

const queryClient = new QueryClient();

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/auth");
  return (
    <>
      {!hideHeader && <AppHeader />}
      {children}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Shell>
            <Routes>
              {/* Redirect root to portfolio dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset" element={<ResetPassword />} />

              {/* Core pages */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/analytics" element={<Analytics />} />

              {/* Submit */}
              <Route path="/submit" element={<SubmitWizard />} />
              {/* Keep legacy form temporarily if needed: */}
              {/* <Route path="/submit-old" element={<Submit />} /> */}

              {/* Custom Dashboards */}
              <Route path="/dashboards" element={<Navigate to="/dashboards/saved" replace />} />
              <Route path="/dashboards/builder" element={<Builder />} />
              <Route path="/dashboards/saved" element={<SavedList />} />
              <Route path="/dashboards/:id" element={<Viewer />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Shell>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
