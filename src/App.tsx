// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingCompletionModal } from "@/components/OnboardingCompletionModal";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { useOnboardingSteps } from "@/hooks/useOnboardingSteps";
import LearndAI from "@/components/LearndAI"; // <-- Floating AI bubble
import RoleSwitcher from "@/components/dev/RoleSwitcher"; // <-- Dev role testing component

// PAGES
import Overview from "@/pages/Overview";
import Projects from "@/pages/Projects";
import Insights from "@/pages/Insights";
import Reports from "@/pages/Reports";
import DashboardCustomizer from "@/pages/DashboardCustomizer";
import SubmitWizard from "@/pages/SubmitWizard";
import Submit from "@/pages/Submit";
import ProjectSubmissionWizard from "@/pages/ProjectSubmissionWizard";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isOnboarding } = useOnboarding();
  
  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  }
  
  // Allow access during onboarding mode even without user
  if (isOnboarding) {
    return <>{children}</>;
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function Shell() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isOnboarding, overlayState, hideOverlay, showCompletionModal, setShowCompletionModal, onImportData, onInviteTeam, onStartTrial } = useOnboarding();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  console.log('Shell component rendered - basic test');
  
  // Initialize onboarding steps logic
  useOnboardingSteps();

  // Check if we should show the welcome screen
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    const onboardingStarted = localStorage.getItem('onboarding_started');
    const urlParams = new URLSearchParams(location.search);
    const hasOnboardingParam = urlParams.get('onboarding') === 'true';

    console.log('[DEBUG] Welcome screen logic check:', {
      onboardingCompleted,
      onboardingStarted,
      hasOnboardingParam,
      pathname: location.pathname,
      loading,
      user: user?.email
    });

    // Show welcome screen if:
    // 1. User hasn't completed onboarding AND
    // 2. (User hasn't started onboarding OR has onboarding parameter) AND 
    // 3. We're on the root path AND
    // 4. Not currently loading
    const shouldShowWelcome = !onboardingCompleted && 
                             (!onboardingStarted || hasOnboardingParam) && 
                             location.pathname === '/' &&
                             !loading;

    console.log('[DEBUG] Should show welcome screen:', shouldShowWelcome);
    setShowWelcomeScreen(shouldShowWelcome);
  }, [user, loading, location]);

  // If we should show welcome screen, render it
  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

  // Hide header & LearndAI on auth-related screens and welcome screen
  const isAuthScreen =
    /^\/auth(\/|$)/i.test(location.pathname) ||
    /^\/reset/i.test(location.pathname) ||
    /^\/reset-password/i.test(location.pathname) ||
    location.pathname === '/welcome';

  return (
    <>
      {!isAuthScreen && <AppHeader />}

      <div className="min-h-[calc(100vh-56px)]">
        <Routes>
          {/* Welcome/Onboarding Route */}
          <Route path="/welcome" element={<WelcomeScreen />} />
          
          {/* Public */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Overview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <Overview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-customizer"
            element={
              <ProtectedRoute>
                <DashboardCustomizer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <Submit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-wizard"
            element={
              <ProtectedRoute>
                <SubmitWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-wizard"
            element={
              <ProtectedRoute>
                <ProjectSubmissionWizard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Onboarding Overlay System */}
      {isOnboarding && !showWelcomeScreen && (
        <OnboardingOverlay
          isVisible={overlayState.isVisible}
          target={overlayState.target}
          tooltip={overlayState.tooltip}
          onClose={hideOverlay}
        />
      )}

      {/* Onboarding Progress Indicator */}
      {isOnboarding && !showWelcomeScreen && <OnboardingProgress />}

      {/* Floating LearndAI bubble (hidden on auth/reset/welcome screens, shown during onboarding tour) */}
      {!isAuthScreen && (!showWelcomeScreen || isOnboarding) && (
        <div className="z-[2000]">
          <LearndAI context={{ from: "global" }} />
        </div>
      )}

      {/* Onboarding Completion Modal */}
      {isOnboarding && (
        <OnboardingCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onImportData={onImportData}
          onInviteTeam={onInviteTeam}
          onStartTrial={onStartTrial}
        />
      )}

      {/* Dev Role Switcher - Fixed position bottom-right (Restricted to specific developer) */}
      {user?.id === '19b03f2b-a719-40b3-b93d-29cea1ae28ba' && <RoleSwitcher />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}
