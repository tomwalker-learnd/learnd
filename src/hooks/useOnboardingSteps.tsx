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
    // Try to find key insights first
    const insightsFound = await highlightElement('[data-testid="key-insights"], .key-insights, [class*="insight"]', 12);
    
    if (insightsFound) {
      showTooltip({
        title: "AI-Generated Insights",
        description: "Learnd automatically analyzes your portfolio and surfaces critical patterns. These insights help you make data-driven decisions.",
        ctaText: "Explore Pattern",
        skipText: "Next",
        onCTA: () => {
          trackInteraction('ai_click', { context: 'overview_insights' });
          showSuccessTooltip("Great! You've discovered how AI identifies portfolio risks automatically.", () => {
            setTimeout(() => highlightMetrics(), 500);
          });
        },
        onSkip: () => {
          hideOverlay();
          setTimeout(() => highlightMetrics(), 500);
        },
        position: 'bottom',
        type: 'interactive'
      });
    } else {
      // Fallback: highlight the main KPI cards
      await highlightMetrics();
    }
  };

  const highlightMetrics = async () => {
    const metricsFound = await highlightElement('[data-testid="kpi-cards"], .grid:has([class*="card"]), [class*="metric"]', 8);
    
    if (metricsFound) {
      showTooltip({
        title: "Portfolio Health Metrics",
        description: "Get instant visibility into active project health, budget performance, and timeline adherence across your entire portfolio.",
        ctaText: "View Projects",
        onCTA: () => {
          hideOverlay();
          nextStep();
        },
        position: 'top',
        type: 'default'
      });
    }
  };

  const runProjectsSteps = async () => {
    // Look for project cards or health indicators
    const projectsFound = await highlightElement('[data-testid="project-card"], .project-card, [class*="border-l-"]:first-of-type', 12);
    
    if (projectsFound) {
      showTooltip({
        title: "Smart Health Indicators",
        description: "Each project shows AI-calculated health status based on satisfaction, budget, timeline, and scope metrics.",
        ctaText: "See At-Risk Analysis",
        onCTA: async () => {
          await highlightAtRiskElements();
        },
        position: 'left'
      });
    }
  };

  const highlightAtRiskElements = async () => {
    // Look for warning/at-risk elements
    const atRiskFound = await highlightElement('[data-health="at-risk"], [class*="amber"], [class*="warning"], [class*="rose"]:first-of-type', 12);
    
    if (atRiskFound) {
      showTooltip({
        title: "At-Risk Project Detected",
        description: "This project shows warning signs: budget overrun and scope changes. The AI flagged it for immediate attention.",
        ctaText: "Analyze Further",
        skipText: "Continue",
        onCTA: () => {
          trackInteraction('completion', { context: 'at_risk_analysis' });
          showSuccessTooltip("Perfect! You can now identify troubled projects instantly and take proactive action.", () => {
            nextStep();
          });
        },
        onSkip: () => {
          hideOverlay();
          nextStep();
        },
        position: 'right',
        type: 'warning'
      });
    } else {
      // Fallback: continue to next step
      hideOverlay();
      setTimeout(() => nextStep(), 1000);
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