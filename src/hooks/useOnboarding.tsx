import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSampleData } from '@/data/sampleData';

export type OnboardingStep = 
  | 'welcome' 
  | 'overview' 
  | 'projects' 
  | 'insights' 
  | 'reports' 
  | 'complete'
  | null;

interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  sampleDataLoaded: boolean;
  startedAt: string;
  interactions: {
    aiClicks: number;
    completions: number;
    pagesVisited: string[];
  };
}

// Overlay system types
interface SpotlightTarget {
  element: Element;
  padding?: number;
}

interface TooltipContent {
  title: string;
  description: string;
  ctaText?: string;
  skipText?: string;
  onCTA?: () => void;
  onSkip?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  type?: 'default' | 'success' | 'warning' | 'interactive';
  requireInteraction?: boolean;
}

interface OnboardingOverlayState {
  isVisible: boolean;
  target: SpotlightTarget | null;
  tooltip: TooltipContent | null;
}

interface OnboardingState extends OnboardingProgress {
  isOnboarding: boolean;
  sampleData: ReturnType<typeof getSampleData>;
  nextStep: () => void;
  previousStep: () => void;
  completeStep: (step: OnboardingStep) => void;
  goToStep: (step: OnboardingStep) => void;
  trackInteraction: (type: 'ai_click' | 'completion' | 'page_visit', data?: any) => void;
  resetOnboarding: () => void;
  finishOnboarding: () => void;
  startOnboarding: () => void;
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;
  onImportData: () => void;
  onInviteTeam: () => void;
  onStartTrial: () => void;
  // Overlay system functions
  highlightElement: (selector: string, padding?: number) => Promise<boolean>;
  showTooltip: (content: TooltipContent) => void;
  hideOverlay: () => void;
  overlayState: OnboardingOverlayState;
  waitForInteraction: (selector: string, eventType?: string) => Promise<void>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'overview', 
  'projects',
  'insights',
  'reports',
  'complete'
];

const STORAGE_KEY = 'learnd_onboarding_progress';

const getInitialProgress = (): OnboardingProgress => ({
  currentStep: 'welcome',
  completedSteps: [],
  sampleDataLoaded: false,
  startedAt: new Date().toISOString(),
  interactions: {
    aiClicks: 0,
    completions: 0,
    pagesVisited: []
  }
});

export const useOnboarding = (): OnboardingState => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if we're in onboarding mode via URL parameter
  const isOnboarding = searchParams.get('onboarding') === 'true';
  
  // Overlay state
  const [overlayState, setOverlayState] = useState<OnboardingOverlayState>({
    isVisible: false,
    target: null,
    tooltip: null
  });
  
  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Load progress from localStorage
  const [progress, setProgress] = useState<OnboardingProgress>(() => {
    if (!isOnboarding) return getInitialProgress();
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...getInitialProgress(),
          ...parsed,
          sampleDataLoaded: true // Always load sample data in onboarding mode
        };
      }
    } catch (error) {
      console.warn('Failed to load onboarding progress:', error);
    }
    
    return {
      ...getInitialProgress(),
      sampleDataLoaded: true
    };
  });

  // Sample data - memoize to avoid recreating on every render
  const sampleData = useMemo(() => getSampleData(), []);

  // Persist progress to localStorage
  useEffect(() => {
    if (isOnboarding) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, isOnboarding]);

  // Track page visits
  useEffect(() => {
    if (isOnboarding) {
      const currentPath = window.location.pathname;
      setProgress(prev => {
        if (!prev.interactions.pagesVisited.includes(currentPath)) {
          return {
            ...prev,
            interactions: {
              ...prev.interactions,
              pagesVisited: [...prev.interactions.pagesVisited, currentPath]
            }
          };
        }
        return prev;
      });
    }
  }, [isOnboarding, window.location.pathname]);

  const nextStep = useCallback(() => {
    if (!isOnboarding || !progress.currentStep) return;
    
    const currentIndex = ONBOARDING_STEPS.indexOf(progress.currentStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextIndex];
      setProgress(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: prev.completedSteps.includes(prev.currentStep!) 
          ? prev.completedSteps 
          : [...prev.completedSteps, prev.currentStep!]
      }));
    }
  }, [isOnboarding, progress.currentStep]);

  const previousStep = useCallback(() => {
    if (!isOnboarding || !progress.currentStep) return;
    
    const currentIndex = ONBOARDING_STEPS.indexOf(progress.currentStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevStep = ONBOARDING_STEPS[prevIndex];
      setProgress(prev => ({
        ...prev,
        currentStep: prevStep
      }));
    }
  }, [isOnboarding, progress.currentStep]);

  const completeStep = useCallback((step: OnboardingStep) => {
    if (!isOnboarding || !step) return;
    
    setProgress(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step) 
        ? prev.completedSteps 
        : [...prev.completedSteps, step],
      interactions: {
        ...prev.interactions,
        completions: prev.interactions.completions + 1
      }
    }));
  }, [isOnboarding]);

  const goToStep = useCallback((step: OnboardingStep) => {
    if (!isOnboarding || !step) return;
    
    setProgress(prev => ({
      ...prev,
      currentStep: step
    }));

    // Navigate to appropriate page based on step
    switch (step) {
      case 'welcome':
        navigate('/?onboarding=true');
        break;
      case 'overview':
        navigate('/overview?onboarding=true');
        break;
      case 'projects':
        navigate('/projects?onboarding=true');
        break;
      case 'insights':
        navigate('/insights?onboarding=true');
        break;
      case 'reports':
        navigate('/reports?onboarding=true');
        break;
      case 'complete':
        navigate('/?onboarding=complete');
        break;
    }
  }, [isOnboarding, navigate]);

  const trackInteraction = useCallback((type: 'ai_click' | 'completion' | 'page_visit', data?: any) => {
    if (!isOnboarding) return;
    
    setProgress(prev => {
      const newInteractions = { ...prev.interactions };
      
      switch (type) {
        case 'ai_click':
          newInteractions.aiClicks += 1;
          break;
        case 'completion':
          newInteractions.completions += 1;
          break;
        case 'page_visit':
          if (data && !newInteractions.pagesVisited.includes(data)) {
            newInteractions.pagesVisited = [...newInteractions.pagesVisited, data];
          }
          break;
      }
      
      return {
        ...prev,
        interactions: newInteractions
      };
    });
  }, [isOnboarding]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress({
      ...getInitialProgress(),
      sampleDataLoaded: true
    });
    navigate('/?onboarding=true');
  }, [navigate]);

  const finishOnboarding = useCallback(() => {
    // Mark current step as completed
    const updatedProgress = {
      ...progress,
      completedSteps: [...progress.completedSteps, progress.currentStep].filter((step, index, array) => 
        array.indexOf(step) === index
      ),
      currentStep: 'complete' as OnboardingStep,
      completedAt: new Date().toISOString()
    };
    
    setProgress(updatedProgress);
    
    // Track completion analytics
    trackInteraction('completion', { 
      context: 'onboarding_finished',
      totalSteps: 5, // welcome, overview, projects, insights, reports
      completedSteps: updatedProgress.completedSteps.length,
      completionTime: new Date().toISOString()
    });
    
    // Show completion modal
    setShowCompletionModal(true);
    hideOverlay();
  }, [progress, trackInteraction]);

  const onImportData = useCallback(() => {
    // Track conversion event
    trackInteraction('completion', { 
      context: 'import_data_selected',
      conversionType: 'real_usage'
    });
    
    // Clear sample data mode
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_converted_to_usage', 'true');
    
    // Remove onboarding params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('onboarding');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, trackInteraction]);

  const onInviteTeam = useCallback(() => {
    // Track collaboration interest
    trackInteraction('completion', { 
      context: 'team_invite_selected',
      conversionType: 'collaboration'
    });
    
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_interested_in_team', 'true');
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('onboarding');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, trackInteraction]);

  const onStartTrial = useCallback(() => {
    // Track premium interest
    trackInteraction('completion', { 
      context: 'premium_trial_selected',
      conversionType: 'premium_upgrade'
    });
    
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_interested_in_premium', 'true');
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('onboarding');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, trackInteraction]);

  // Overlay system functions
  const highlightElement = useCallback(async (selector: string, padding: number = 8): Promise<boolean> => {
    return new Promise((resolve) => {
      const findElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          setOverlayState(prev => ({
            ...prev,
            isVisible: true,
            target: { element, padding }
          }));
          resolve(true);
          return true;
        }
        return false;
      };

      // Try to find element immediately
      if (findElement()) return;

      // If not found, wait for it to appear
      const observer = new MutationObserver(() => {
        if (findElement()) {
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, 5000);
    });
  }, []);

  const showTooltip = useCallback((content: TooltipContent) => {
    setOverlayState(prev => ({
      ...prev,
      tooltip: content
    }));
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlayState({
      isVisible: false,
      target: null,
      tooltip: null
    });
  }, []);

  const waitForInteraction = useCallback((selector: string, eventType: string = 'click'): Promise<void> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (!element) {
        resolve();
        return;
      }

      const handler = () => {
        element.removeEventListener(eventType, handler);
        resolve();
      };

      element.addEventListener(eventType, handler);

      // Cleanup after 30 seconds
      setTimeout(() => {
        element.removeEventListener(eventType, handler);
        resolve();
      }, 30000);
    });
  }, []);

  const startOnboarding = useCallback(() => {
    // Clear any existing onboarding state
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_started');
    
    // Reset progress to initial state
    setProgress(getInitialProgress());
    
    // Navigate to welcome screen
    window.location.href = '/';
  }, []);

  return {
    isOnboarding,
    sampleData,
    currentStep: progress.currentStep,
    completedSteps: progress.completedSteps,
    sampleDataLoaded: progress.sampleDataLoaded,
    startedAt: progress.startedAt,
    interactions: progress.interactions,
    nextStep,
    previousStep,
    completeStep,
    goToStep,
    trackInteraction,
    resetOnboarding,
    finishOnboarding,
    startOnboarding,
    // Overlay system
    highlightElement,
    showTooltip,
    hideOverlay,
    overlayState,
    waitForInteraction,
    // Completion flow
    showCompletionModal,
    setShowCompletionModal,
    onImportData,
    onInviteTeam,
    onStartTrial
  };
};

// Helper hook for components that need to check if they're in onboarding mode
export const useIsOnboarding = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get('onboarding') === 'true';
};

// Helper hook to get current onboarding step without full state
export const useOnboardingStep = (): OnboardingStep => {
  const { currentStep, isOnboarding } = useOnboarding();
  return isOnboarding ? currentStep : null;
};