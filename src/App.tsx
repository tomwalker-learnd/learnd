import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";

import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Submit from "@/pages/Submit";              // optional legacy form
import SubmitWizard from "@/pages/SubmitWizard";  // new multi-step form
import Lessons from "@/pages/Lessons";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* New multi-step submission wizard */}
            <Route path="/submit" element={<SubmitWizard />} />
            {/* Keep old single-page form accessible (optional) */}
            {/* <Route path="/submit-old" element={<Submit />} /> */}

            <Route path="/lessons" element={<Lessons />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
