/**
 * ============================================================================
 * AI INSIGHTS BANNER - Context-aware AI suggestions
 * ============================================================================
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Target, Brain } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';
import { PremiumFeature } from '@/components/premium';
import type { ProjectLifecycleStatus, ProjectHealth } from '@/lib/statusUtils';

interface AIInsightsBannerProps {
  projectCount: number;
  lifecycleFilter: ProjectLifecycleStatus[];
  healthFilter: ProjectHealth[];
  onPromptSelect: (prompt: string, action: 'ask' | 'trend' | 'data_pack') => void;
}

export function AIInsightsBanner({ 
  projectCount, 
  lifecycleFilter, 
  healthFilter, 
  onPromptSelect 
}: AIInsightsBannerProps) {
  const { canAccessAI, canAccessAdvancedAnalytics } = useUserTier();

  // Determine context based on filters
  const isActiveView = lifecycleFilter.includes('active');
  const isCompletedView = lifecycleFilter.includes('completed');
  const isMixedView = isActiveView && isCompletedView;
  const hasHealthFilter = healthFilter.length > 0;

  // Get contextual insights and prompts
  const getContextualInsights = () => {
    if (isMixedView) {
      return {
        icon: <Brain className="h-4 w-4" />,
        title: "Cross-Lifecycle Analysis Available",
        description: "AI found correlations between active risks and past project outcomes",
        prompts: [
          { text: "Analyze patterns between completed and active projects", action: 'trend' as const },
          { text: "Predict active project outcomes based on historical data", action: 'ask' as const },
          { text: "Identify success patterns to apply to current work", action: 'trend' as const }
        ]
      };
    }

    if (isActiveView && !isCompletedView) {
      const hasRiskyProjects = healthFilter.includes('at-risk') || healthFilter.includes('critical');
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: hasRiskyProjects ? "Intervention Opportunities Detected" : "Active Project Insights Available",
        description: hasRiskyProjects 
          ? "AI noticed budget trends requiring immediate attention"
          : "AI can identify optimization opportunities for your active projects",
        prompts: [
          { text: "Identify intervention opportunities for at-risk projects", action: 'ask' as const },
          { text: "Predict which projects may go over budget", action: 'trend' as const },
          { text: "Suggest process improvements for current work", action: 'ask' as const },
          { text: "Generate early warning indicators", action: 'data_pack' as const }
        ]
      };
    }

    if (isCompletedView && !isActiveView) {
      const hasUnderperformed = healthFilter.includes('underperformed');
      return {
        icon: <Target className="h-4 w-4" />,
        title: hasUnderperformed ? "Improvement Patterns Identified" : "Success Patterns Available",
        description: hasUnderperformed
          ? "AI identified patterns in underperformed projects for future prevention"
          : "AI identified success patterns you can replicate",
        prompts: [
          { text: "Analyze patterns in underperformed projects", action: 'trend' as const },
          { text: "Extract key lessons from successful deliveries", action: 'ask' as const },
          { text: "Identify predictive indicators for future projects", action: 'trend' as const },
          { text: "Create replication playbook from top performers", action: 'data_pack' as const }
        ]
      };
    }

    // Default/fallback
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "AI Analysis Available",
      description: "Get insights from your project portfolio",
      prompts: [
        { text: "Analyze overall portfolio trends", action: 'trend' as const },
        { text: "Identify improvement opportunities", action: 'ask' as const }
      ]
    };
  };

  const insights = getContextualInsights();

  if (projectCount === 0) return null;

  return (
    <PremiumFeature requiredTier="team" showUpgradePrompt={false}>
      <Alert className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="text-primary mt-0.5">
            {insights.icon}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground">{insights.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </div>
              <AlertDescription className="text-sm text-muted-foreground">
                {insights.description}
              </AlertDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {insights.prompts.slice(0, canAccessAI() ? 4 : 2).map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onPromptSelect(prompt.text, prompt.action)}
                  className="text-xs h-8"
                  disabled={!canAccessAdvancedAnalytics()}
                >
                  {prompt.text}
                </Button>
              ))}
              
              {!canAccessAI() && insights.prompts.length > 2 && (
                <Badge variant="outline" className="text-xs opacity-60">
                  +{insights.prompts.length - 2} more with Enterprise
                </Badge>
              )}
            </div>

            {!canAccessAdvancedAnalytics() && (
              <div className="text-xs text-muted-foreground">
                Upgrade to unlock AI-powered insights and predictive analysis
              </div>
            )}
          </div>
        </div>
      </Alert>
    </PremiumFeature>
  );
}