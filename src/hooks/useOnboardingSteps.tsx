import { useEffect } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";

// Hook to automatically trigger onboarding steps based on current step
export const useOnboardingSteps = () => {
  const { 
    currentStep, 
    isOnboarding, 
    highlightElement, 
    showTooltip, 
    hideOverlay,
    nextStep,
    trackInteraction
  } = useOnboarding();

  useEffect(() => {
    if (!isOnboarding || !currentStep) return;

    const runStepLogic = async () => {
      switch (currentStep) {
        case 'overview':
          await runOverviewSteps();
          break;
        case 'projects':
          await runProjectsSteps();
          break;
        case 'insights':
          await runInsightsSteps();
          break;
        case 'reports':
          await runReportsSteps();
          break;
        default:
          break;
      }
    };

    // Small delay to ensure page is loaded
    const timer = setTimeout(runStepLogic, 1500);
    return () => clearTimeout(timer);
  }, [currentStep, isOnboarding]);

  const runOverviewSteps = async () => {
    // First highlight the key insights section
    const insightsFound = await highlightElement('[data-onboarding="key-insights"]', 12);
    
    if (insightsFound) {
      showTooltip({
        title: "Your Portfolio Intelligence Hub",
        description: "These AI-generated insights analyze your entire portfolio to surface critical patterns and opportunities you might miss.",
        ctaText: "View AI Insights",
        skipText: "Skip",
        onCTA: () => {
          // Highlight the specific AI insight card
          setTimeout(() => highlightAIInsightCard(), 500);
        },
        onSkip: () => {
          hideOverlay();
          setTimeout(() => highlightMetrics(), 1000);
        },
        position: 'bottom',
        type: 'default'
      });
    } else {
      // Fallback: highlight the main KPI cards
      await highlightMetrics();
    }
  };

  const highlightAIInsightCard = async () => {
    const aiInsightFound = await highlightElement('[data-onboarding="ai-insight-card"]', 12);
    
    if (aiInsightFound) {
      showTooltip({
        title: "Discover Portfolio Patterns",
        description: "Click this AI insight to see how machine learning identified a critical budget pattern in your tech projects.",
        ctaText: "Click to Explore",
        skipText: "Skip Demo",
        onCTA: () => {
          // The actual click will be handled by the card's onClick
          hideOverlay();
        },
        onSkip: () => {
          hideOverlay();
          setTimeout(() => highlightMetrics(), 500);
        },
        position: 'right',
        type: 'interactive',
        requireInteraction: true
      });
    } else {
      // Continue to metrics
      await highlightMetrics();
    }
  };

  const highlightMetrics = async () => {
    const metricsFound = await highlightElement('[data-onboarding="project-kpis"]', 8);
    
    if (metricsFound) {
      showTooltip({
        title: "Portfolio Health at a Glance",
        description: "These key metrics show your portfolio's health: 3 projects at risk, 4.2/5 client satisfaction, and 87% on-time delivery rate.",
        ctaText: "Explore Projects",
        onCTA: () => {
          trackInteraction('completion', { context: 'overview_metrics' });
          hideOverlay();
          nextStep();
        },
        position: 'top',
        type: 'default'
      });
    } else {
      // Continue to next step anyway
      nextStep();
    }
  };

  const runProjectsSteps = async () => {
    // First highlight the risk filter showing at-risk projects
    const filterFound = await highlightElement('[data-onboarding="risk-projects-filter"]', 12);
    
    if (filterFound) {
      showTooltip({
        title: "Smart Risk Detection",
        description: "Your portfolio automatically identifies projects that need attention. Currently showing 3 At Risk projects with budget or timeline issues.",
        ctaText: "Explore At-Risk Project",
        onCTA: async () => {
          await highlightExpandedProject();
        },
        position: 'bottom',
        type: 'default'
      });
    } else {
      // Fallback to expanded project
      await highlightExpandedProject();
    }
  };

  const highlightExpandedProject = async () => {
    const expandedFound = await highlightElement('[data-onboarding="expanded-project"]', 12);
    
    if (expandedFound) {
      showTooltip({
        title: "Project Deep Dive",
        description: "This Mobile App Redesign project shows multiple warning signs: 40% over budget, 3 weeks behind schedule, and 8 scope changes.",
        ctaText: "Analyze Pattern",
        onCTA: async () => {
          await highlightAIAnalysisButton();
        },
        position: 'right',
        type: 'warning'
      });
    } else {
      // Continue anyway
      await highlightAIAnalysisButton();
    }
  };

  const highlightAIAnalysisButton = async () => {
    const aiButtonFound = await highlightElement('[data-onboarding="project-ai-analysis"]', 8);
    
    if (aiButtonFound) {
      showTooltip({
        title: "AI Pattern Recognition",
        description: "Click 'Get AI Analysis' to discover why this project is struggling and how to prevent similar issues in future projects.",
        ctaText: "Click Button Below",
        onCTA: () => {
          // The actual click will be handled by the button's onClick
          hideOverlay();
        },
        position: 'top',
        type: 'interactive',
        requireInteraction: true
      });
    } else {
      // Continue to next step
      nextStep();
    }
  };

  const runInsightsSteps = async () => {
    // Highlight the preset analysis buttons
    const presetFound = await highlightElement('[data-onboarding="preset-analysis"]', 12);
    
    if (presetFound) {
      showTooltip({
        title: "AI-Powered Analysis Tools",
        description: "Click 'Budget Performance Analysis' to see how AI identifies patterns like 'Marketing projects deliver 15% better ROI but take 20% longer'.",
        ctaText: "Try Analysis",
        onCTA: () => {
          hideOverlay();
          // The button click will be handled by the page
        },
        position: 'bottom',
        type: 'interactive',
        requireInteraction: true
      });
    } else {
      nextStep();
    }
  };

  const runReportsSteps = async () => {
    // Highlight the report preview
    const reportFound = await highlightElement('[data-onboarding="report-preview"]', 12);
    
    if (reportFound) {
      showTooltip({
        title: "Professional Portfolio Reports",
        description: "This Q4 Portfolio Health Report shows how Learnd generates executive-ready reports with actionable insights and professional formatting.",
        ctaText: "Complete Tour",
        onCTA: () => {
          trackInteraction('completion', { context: 'reports_completed' });
          showSuccessTooltip("Excellent! You've mastered Learnd's portfolio intelligence system. Ready to make smarter project decisions?", () => {
            hideOverlay();
            setTimeout(() => nextStep(), 1000); // This will trigger completion
          });
        },
        position: 'right',
        type: 'default'
      });
    } else {
      // Complete anyway
      nextStep();
    }
  };

  const showSuccessTooltip = (message: string, onContinue: () => void) => {
    showTooltip({
      title: "Excellent Work!",
      description: message,
      ctaText: "Continue",
      onCTA: () => {
        hideOverlay();
        onContinue();
      },
      type: 'success'
    });
  };

  return {
    currentStep,
    isOnboarding
  };
};