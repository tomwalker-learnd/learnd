// src/App.tsx
import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useInRouterContext,
  HashRouter,
} from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";

import AppHeader from "@/components/AppHeader";

import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import SubmitWizard from "@/pages/SubmitWizard";
import Lessons from "@/pages/Lessons";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

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

function AppRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset" element={<ResetPassword />} />

        {/* Core */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* Submit */}
        <Route path="/submit" element={<SubmitWizard />} />

        {/* Custom Dashboards */}
        <Route path="/dashboards" element={<Navigate to="/dashboards/saved" replace />} />
        <Route path="/dashboards/builder" element={<Builder />} />
        <Route path="/dashboards/saved" element={<SavedList />} />
        <Route path="/dashboards/:id" element={<Viewer />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}

function AppInner() {
  const inRouter = useInRouterContext();
  const isLovableHost =
    /lovable\./i.test(window.location.host) ||
    import.meta.env.VITE_USE_HASH_ROUTER === "1";

  // If no router above us and we're on Lovable (or forced), mount HashRouter.
  if (!inRouter && isLovableHost) {
    return (
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    );
  }
  // Otherwise, assume a router is already provided (e.g., BrowserRouter in live).
  return <AppRoutes />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppInner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
