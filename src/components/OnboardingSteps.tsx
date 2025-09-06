import { useEffect } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";

// Predefined onboarding steps with their specific interactions
export const useOnboardingSteps = () => {
  const { 
    currentStep, 
    isOnboarding, 
    highlightElement, 
    showTooltip, 
    hideOverlay,
    nextStep,
    waitForInteraction,
    trackInteraction
  } = useOnboarding();

  useEffect(() => {
    if (!isOnboarding || !currentStep) return;

    const runStepLogic = async () => {
      switch (currentStep) {
        case 'overview':
          await overviewStepLogic();
          break;
        case 'projects':
          await projectsStepLogic();
          break;
        case 'insights':
          await insightsStepLogic();
          break;
        case 'reports':
          await reportsStepLogic();
          break;
        default:
          break;
      }
    };

    // Small delay to ensure page is loaded
    const timer = setTimeout(runStepLogic, 1000);
    return () => clearTimeout(timer);
  }, [currentStep, isOnboarding]);

  const overviewStepLogic = async () => {
    // Step 1: Highlight key insights section
    const insightsHighlighted = await highlightElement('[data-onboarding="key-insights"]', 12);
    
    if (insightsHighlighted) {
      showTooltip({
        title: "AI-Generated Insights",
        description: "Learnd automatically analyzes your portfolio and surfaces critical patterns. These insights help you make data-driven decisions.",
        ctaText: "Explore Insights",
        skipText: "Next",
        onCTA: async () => {
          trackInteraction('ai_click', { context: 'overview_insights' });
          
          // Show success tooltip
          showTooltip({
            title: "Great Discovery!",
            description: "You've seen how AI identifies portfolio risks and opportunities automatically.",
            ctaText: "Continue Tour",
            onCTA: () => {
              hideOverlay();
              setTimeout(() => highlightProjectsKPIs(), 500);
            },
            type: 'success'
          });
        },
        onSkip: () => {
          hideOverlay();
          setTimeout(() => highlightProjectsKPIs(), 500);
        },
        position: 'bottom',
        type: 'interactive'
      });
    }
  };

  const highlightProjectsKPIs = async () => {
    const kpisHighlighted = await highlightElement('[data-onboarding="project-kpis"]', 8);
    
    if (kpisHighlighted) {
      showTooltip({
        title: "Portfolio Health Metrics",
        description: "Get instant visibility into active project health, budget performance, and timeline adherence.",
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

  const projectsStepLogic = async () => {
    // Step 1: Highlight project health indicators
    const healthHighlighted = await highlightElement('[data-onboarding="project-health"]', 8);
    
    if (healthHighlighted) {
      showTooltip({
        title: "Smart Health Indicators",
        description: "Each project shows AI-calculated health status based on satisfaction, budget, timeline, and scope metrics.",
        ctaText: "See At-Risk Project",
        onCTA: async () => {
          await highlightAtRiskProject();
        },
        position: 'left'
      });
    }
  };

  const highlightAtRiskProject = async () => {
    const atRiskHighlighted = await highlightElement('[data-health="at-risk"]:first-of-type', 12);
    
    if (atRiskHighlighted) {
      showTooltip({
        title: "At-Risk Project Detected",
        description: "This project shows warning signs: budget overrun and scope changes. The AI flagged it for immediate attention.",
        ctaText: "Analyze Further",
        skipText: "Continue",
        onCTA: () => {
          trackInteraction('completion', { context: 'at_risk_analysis' });
          showTooltip({
            title: "Perfect!",
            description: "You can now identify troubled projects instantly and take proactive action.",
            ctaText: "Next: AI Analytics",
            onCTA: () => {
              hideOverlay();
              nextStep();
            },
            type: 'success'
          });
        },
        onSkip: () => {
          hideOverlay();
          nextStep();
        },
        position: 'right',
        type: 'warning'
      });
    }
  };

  const insightsStepLogic = async () => {
    // Step 1: Highlight AI insights section
    const aiInsightsHighlighted = await highlightElement('[data-onboarding="ai-insights"]', 12);
    
    if (aiInsightsHighlighted) {
      showTooltip({
        title: "Advanced AI Analytics",
        description: "Discover patterns invisible to the human eye. AI analyzes trends, predicts risks, and recommends actions.",
        ctaText: "Try AI Analysis",
        onCTA: async () => {
          await highlightPredictiveMetrics();
        },
        position: 'bottom',
        type: 'interactive'
      });
    }
  };

  const highlightPredictiveMetrics = async () => {
    const metricsHighlighted = await highlightElement('[data-onboarding="predictive-metrics"]', 8);
    
    if (metricsHighlighted) {
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
    }
  };

  const reportsStepLogic = async () => {
    // Step 1: Highlight report generation
    const reportsHighlighted = await highlightElement('[data-onboarding="report-generator"]', 10);
    
    if (reportsHighlighted) {
      showTooltip({
        title: "Professional Reporting",
        description: "Generate executive summaries, client reports, and portfolio analyses with one click. Impress stakeholders with data-driven insights.",
        ctaText: "Generate Sample Report",
        onCTA: async () => {
          trackInteraction('completion', { context: 'report_generation' });
          
          // Simulate report generation
          showTooltip({
            title: "Report Generated!",
            description: "You've mastered Learnd's portfolio intelligence system. Ready to transform your project management?",
            ctaText: "Complete Tour",
            onCTA: () => {
              hideOverlay();
              nextStep(); // This will go to 'complete'
            },
            type: 'success'
          });
        },
        position: 'bottom',
        type: 'interactive'
      });
    }
  };

  return {
    currentStep,
    isOnboarding
  };
};