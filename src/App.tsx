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
import Submit from "@/pages/Submit";            // keep if referenced elsewhere
import SubmitWizard from "@/pages/SubmitWizard";
import Lessons from "@/pages/Lessons";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Hide header on auth routes
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/submit" element={<SubmitWizard />} />
              {/* If you still want the old form temporarily:
                  <Route path="/submit-old" element={<Submit />} /> */}
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Shell>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
