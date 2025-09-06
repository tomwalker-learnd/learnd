/**
 * ============================================================================
 * ENHANCED LEARND AI - Context-aware AI with lifecycle insights
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import LearndAI, { type LearndAIProps } from '@/components/LearndAI';
import { useUserTier } from '@/hooks/useUserTier';
import type { ProjectLifecycleStatus, ProjectHealth } from '@/lib/statusUtils';

interface EnhancedLearndAIProps extends Omit<LearndAIProps, 'context'> {
  lifecycleContext?: ProjectLifecycleStatus[];
  healthContext?: ProjectHealth[];
  projectData?: any[];
  suggestedPrompts?: Array<{
    text: string;
    action: 'ask' | 'trend' | 'data_pack';
    tier: 'free' | 'team' | 'business' | 'enterprise';
  }>;
}

export function EnhancedLearndAI({ 
  lifecycleContext = [], 
  healthContext = [],
  projectData = [],
  suggestedPrompts = [],
  ...props 
}: EnhancedLearndAIProps) {
  const { tier, canAccessAI, canAccessAdvancedAnalytics } = useUserTier();
  const [enhancedContext, setEnhancedContext] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Build enhanced context for AI
    const context = {
      lifecycleFilter: lifecycleContext,
      healthFilter: healthContext,
      projectCount: projectData.length,
      userTier: tier,
      analytics: {
        hasActiveProjects: lifecycleContext.includes('active'),
        hasCompletedProjects: lifecycleContext.includes('completed'),
        hasRiskProjects: healthContext.includes('at-risk') || healthContext.includes('critical'),
        hasSuccessfulProjects: healthContext.includes('successful'),
        hasUnderperformed: healthContext.includes('underperformed')
      },
      aggregatedMetrics: projectData.length > 0 ? {
        totalProjects: projectData.length,
        avgSatisfaction: projectData.reduce((sum, p) => sum + (p.satisfaction || 0), 0) / projectData.length,
        budgetPerformance: {
          onBudget: projectData.filter(p => p.budget_status === 'on').length,
          overBudget: projectData.filter(p => p.budget_status === 'over').length,
          underBudget: projectData.filter(p => p.budget_status === 'under').length
        },
        timelinePerformance: {
          onTime: projectData.filter(p => p.timeline_status === 'on-time').length,
          delayed: projectData.filter(p => p.timeline_status === 'delayed').length,
          early: projectData.filter(p => p.timeline_status === 'early').length
        }
      } : null
    };

    setEnhancedContext(context);
  }, [lifecycleContext, healthContext, projectData, tier]);

  // Get smart prompts based on context and tier
  const getSmartPrompts = () => {
    const basePrompts = [
      {
        text: "Analyze my project portfolio performance",
        action: 'trend' as const,
        tier: 'team' as const,
        icon: <TrendingUp className="h-3 w-3" />
      },
      {
        text: "Identify improvement opportunities",
        action: 'ask' as const,
        tier: 'team' as const,
        icon: <Brain className="h-3 w-3" />
      }
    ];

    const advancedPrompts = [
      {
        text: "Predict project success likelihood",
        action: 'trend' as const,
        tier: 'business' as const,
        icon: <Sparkles className="h-3 w-3" />
      },
      {
        text: "Generate intervention recommendations",
        action: 'ask' as const,
        tier: 'business' as const,
        icon: <AlertTriangle className="h-3 w-3" />
      }
    ];

    const enterprisePrompts = [
      {
        text: "Create predictive risk model",
        action: 'data_pack' as const,
        tier: 'enterprise' as const,
        icon: <Brain className="h-3 w-3" />
      },
      {
        text: "Build custom success patterns",
        action: 'trend' as const,
        tier: 'enterprise' as const,
        icon: <Sparkles className="h-3 w-3" />
      }
    ];

    // Filter prompts based on user tier
    const tierHierarchy = ['free', 'team', 'business', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(tier || 'free');
    
    return [...basePrompts, ...advancedPrompts, ...enterprisePrompts]
      .filter(prompt => tierHierarchy.indexOf(prompt.tier) <= userTierIndex);
  };

  const smartPrompts = getSmartPrompts();

  return (
    <div className="space-y-4">
      {/* Smart Prompts Section */}
      {smartPrompts.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">AI-Powered Insights</h4>
            <Badge variant="secondary" className="text-xs">
              Smart Prompts
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {smartPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-8"
                disabled={!canAccessAdvancedAnalytics()}
              >
                {prompt.icon}
                <span className="ml-2 truncate">{prompt.text}</span>
              </Button>
            ))}
          </div>

          {!canAccessAdvancedAnalytics() && (
            <p className="text-xs text-muted-foreground mt-2">
              Upgrade to unlock advanced AI analysis and predictive insights
            </p>
          )}
        </div>
      )}

      {/* Enhanced LearndAI Component */}
      <LearndAI 
        {...props}
        context={enhancedContext}
      />
    </div>
  );
}