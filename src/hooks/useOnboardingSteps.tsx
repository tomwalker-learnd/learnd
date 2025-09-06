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
    // Look for AI insights or analytics content
    const insightsFound = await highlightElement('[data-testid="ai-insights"], [class*="brain"], .insights-section, [class*="chart"]', 12);
    
    if (insightsFound) {
      showTooltip({
        title: "Advanced AI Analytics",
        description: "Discover patterns invisible to the human eye. AI analyzes trends, predicts risks, and recommends actions.",
        ctaText: "Try Analysis",
        onCTA: async () => {
          trackInteraction('ai_click', { context: 'insights_analysis' });
          await highlightPredictiveMetrics();
        },
        position: 'bottom',
        type: 'interactive'
      });
    }
  };

  const highlightPredictiveMetrics = async () => {
    // Look for charts, metrics, or analytics
    const metricsFound = await highlightElement('[data-testid="metrics"], [class*="chart"], .recharts-wrapper, [class*="analytic"]', 8);
    
    if (metricsFound) {
      showTooltip({
        title: "Predictive Intelligence",
        description: "These metrics forecast project outcomes and identify optimization opportunities before issues occur.",
        ctaText: "Explore Reports",
        onCTA: () => {
          hideOverlay();
          nextStep();
        },
        position: 'top'
      });
    } else {
      // Continue to reports
      hideOverlay();
      setTimeout(() => nextStep(), 1000);
    }
  };

  const runReportsSteps = async () => {
    // Look for report-related elements
    const reportsFound = await highlightElement('[data-testid="reports"], [class*="report"], button:has-text("Report"), button:has-text("Export")', 10);
    
    if (reportsFound) {
      showTooltip({
        title: "Professional Reporting",
        description: "Generate executive summaries, client reports, and portfolio analyses with one click. Impress stakeholders with data-driven insights.",
        ctaText: "Generate Sample Report",
        onCTA: () => {
          trackInteraction('completion', { context: 'report_generation' });
          showSuccessTooltip("Excellent! You've mastered Learnd's portfolio intelligence system. Ready to make smarter project decisions?", () => {
            nextStep(); // This will go to 'complete'
          });
        },
        position: 'bottom',
        type: 'interactive'
      });
    } else {
      // Complete the tour
      showSuccessTooltip("Tour completed! You're ready to use Learnd's powerful portfolio intelligence features.", () => {
        nextStep();
      });
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