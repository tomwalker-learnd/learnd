/**
 * ============================================================================
 * USAGE TRACKING HOOK - Freemium limitations and conversion tracking
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";

export type UsageMetrics = {
  lessonsUsed: number;
  lessonsLimit: number;
  lessonsPercentage: number;
  dataRetentionDays: number;
  exportCount: number;
  exportLimit: number;
  aiQueriesUsed: number;
  aiQueriesLimit: number;
  dashboardsUsed: number;
  dashboardsLimit: number;
};

export type UsageLimitation = {
  type: 'lessons' | 'exports' | 'ai' | 'dashboards' | 'data_retention';
  isBlocked: boolean;
  message: string;
  upgradePrompt: string;
};

export function useUsageTracking() {
  const { user } = useAuth();
  const { tier } = useUserTier();
  const [usage, setUsage] = useState<UsageMetrics>({
    lessonsUsed: 0,
    lessonsLimit: 25,
    lessonsPercentage: 0,
    dataRetentionDays: 90,
    exportCount: 0,
    exportLimit: 0,
    aiQueriesUsed: 0,
    aiQueriesLimit: 0,
    dashboardsUsed: 0,
    dashboardsLimit: 3
  });
  const [loading, setLoading] = useState(true);

  // Get tier-specific limits
  const getTierLimits = useCallback((currentTier: string | null) => {
    switch (currentTier) {
      case 'team':
        return {
          lessonsLimit: 500,
          dataRetentionDays: 365,
          exportLimit: 50,
          aiQueriesLimit: 50,
          dashboardsLimit: 10
        };
      case 'business':
        return {
          lessonsLimit: 2000,
          dataRetentionDays: 1095, // 3 years
          exportLimit: 200,
          aiQueriesLimit: 200,
          dashboardsLimit: 50
        };
      case 'enterprise':
        return {
          lessonsLimit: -1, // unlimited
          dataRetentionDays: -1, // unlimited
          exportLimit: -1,
          aiQueriesLimit: -1,
          dashboardsLimit: -1
        };
      default: // free
        return {
          lessonsLimit: 25,
          dataRetentionDays: 90,
          exportLimit: 0,
          aiQueriesLimit: 0,
          dashboardsLimit: 3
        };
    }
  }, []);

  // Load usage data
  const loadUsage = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const limits = getTierLimits(tier);

      // Count lessons (within retention period for free users)
      let lessonsQuery = supabase
        .from('lessons')
        .select('id', { count: 'exact' })
        .eq('created_by', user.id);

      // Apply data retention filter for free tier
      if (tier === 'free' || !tier) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - limits.dataRetentionDays);
        lessonsQuery = lessonsQuery.gte('created_at', cutoffDate.toISOString());
      }

      const { count: lessonsCount } = await lessonsQuery;

      // Count exports this month (for paid tiers)
      const monthStart = new Date();
      monthStart.setDate(1);
      const { count: exportCount } = await supabase
        .from('lessons') // This would be an exports table in a real app
        .select('id', { count: 'exact' })
        .eq('created_by', user.id)
        .gte('created_at', monthStart.toISOString());

      // Count AI queries this month (for paid tiers) 
      const { count: aiQueriesCount } = await supabase
        .from('ai_requests') // This would exist in the real app
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .then(result => result, () => ({ count: 0 })); // Fallback if table doesn't exist

      setUsage({
        lessonsUsed: lessonsCount || 0,
        lessonsLimit: limits.lessonsLimit,
        lessonsPercentage: limits.lessonsLimit > 0 ? 
          Math.round(((lessonsCount || 0) / limits.lessonsLimit) * 100) : 0,
        dataRetentionDays: limits.dataRetentionDays,
        exportCount: exportCount || 0,
        exportLimit: limits.exportLimit,
        aiQueriesUsed: aiQueriesCount || 0,
        aiQueriesLimit: limits.aiQueriesLimit,
        dashboardsUsed: 0, // Would come from dashboards table
        dashboardsLimit: limits.dashboardsLimit
      });
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, tier, getTierLimits]);

  // Check if a feature is blocked by limits
  const checkLimitation = useCallback((type: UsageLimitation['type']): UsageLimitation => {
    switch (type) {
      case 'lessons':
        const isLessonsBlocked = usage.lessonsLimit > 0 && usage.lessonsUsed >= usage.lessonsLimit;
        return {
          type: 'lessons',
          isBlocked: isLessonsBlocked,
          message: isLessonsBlocked ? 
            `You've reached your limit of ${usage.lessonsLimit} lessons` :
            `${usage.lessonsUsed} of ${usage.lessonsLimit} lessons used`,
          upgradePrompt: 'Upgrade to capture unlimited project insights'
        };

      case 'exports':
        const isExportsBlocked = tier === 'free' || !tier;
        return {
          type: 'exports',
          isBlocked: isExportsBlocked,
          message: isExportsBlocked ? 
            'Export features are available for Team plans and above' :
            `${usage.exportCount} of ${usage.exportLimit} exports used this month`,
          upgradePrompt: 'Upgrade to unlock powerful export capabilities'
        };

      case 'ai':
        const isAiBlocked = tier === 'free' || !tier;
        return {
          type: 'ai',
          isBlocked: isAiBlocked,
          message: isAiBlocked ?
            'AI-powered insights are available for Team plans and above' :
            `${usage.aiQueriesUsed} of ${usage.aiQueriesLimit} AI queries used`,
          upgradePrompt: 'Upgrade to unlock AI-powered analysis worth $20/user'
        };

      case 'dashboards':
        const isDashboardsBlocked = usage.dashboardsUsed >= usage.dashboardsLimit;
        return {
          type: 'dashboards',
          isBlocked: isDashboardsBlocked,
          message: isDashboardsBlocked ?
            `You've reached your limit of ${usage.dashboardsLimit} dashboards` :
            `${usage.dashboardsUsed} of ${usage.dashboardsLimit} dashboards used`,
          upgradePrompt: 'Upgrade for unlimited custom dashboards'
        };

      case 'data_retention':
        const isRetentionLimited = tier === 'free' || !tier;
        return {
          type: 'data_retention',
          isBlocked: false, // Not blocking, but limiting
          message: isRetentionLimited ?
            `Data is retained for ${usage.dataRetentionDays} days on free plan` :
            'Unlimited data retention',
          upgradePrompt: 'Upgrade for extended data retention and historical analysis'
        };

      default:
        return {
          type,
          isBlocked: false,
          message: '',
          upgradePrompt: ''
        };
    }
  }, [usage, tier]);

  // Track feature usage for conversion optimization
  const trackUsage = useCallback(async (feature: string, metadata?: any) => {
    if (!user) return;

    // In a real app, this would send to analytics
    console.log(`Feature usage tracked: ${feature}`, {
      user_id: user.id,
      tier,
      feature,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    // Optional: Store in Supabase for usage analytics (would require usage_events table)
    try {
      // This would require a usage_events table in a real implementation
      // await supabase.from('usage_events').insert({ ... });
      console.log('Usage tracking would be stored here');
    } catch (error) {
      // Silent fail - usage tracking shouldn't break the app
    }
  }, [user, tier]);

  // Check if approaching limits (for proactive upgrade prompts)
  const getUpgradeOpportunity = useCallback(() => {
    if (tier !== 'free' && tier !== null) return null;

    const lessonsWarning = usage.lessonsPercentage >= 80;
    const retentionConcern = usage.dataRetentionDays === 90;

    if (lessonsWarning) {
      return {
        trigger: 'lessons_limit_approaching',
        message: `You're at ${usage.lessonsPercentage}% of your lesson limit`,
        urgency: usage.lessonsPercentage >= 95 ? 'high' : 'medium',
        suggestedTier: 'team'
      };
    }

    if (retentionConcern && usage.lessonsUsed > 15) {
      return {
        trigger: 'data_retention_concern',
        message: 'Your older insights will be automatically removed after 90 days',
        urgency: 'low',
        suggestedTier: 'team'
      };
    }

    return null;
  }, [usage, tier]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  return {
    usage,
    loading,
    checkLimitation,
    trackUsage,
    getUpgradeOpportunity,
    refresh: loadUsage
  };
}