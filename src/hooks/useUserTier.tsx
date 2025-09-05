/**
 * ============================================================================
 * USER TIER HOOK - Subscription tier-based feature access control
 * ============================================================================
 * 
 * FEATURES:
 * - Tier Management: Maps subscription tiers to feature access
 * - Feature Gates: Controls access to exports, analytics, dashboards, and AI
 * - Loading States: Handles authentication loading gracefully
 * - Tier Validation: Validates user tiers against subscription levels
 * - Helper Functions: Provides easy tier checking throughout the app
 * 
 * TIER HIERARCHY:
 * - free → Basic access (limited features)
 * - team → Team features + exports
 * - business → Advanced analytics + custom dashboards
 * - enterprise → Full AI access + unlimited features
 * 
 * USAGE:
 * - Used throughout the app to check subscription-based permissions
 * - Integrates with existing useAuth hook for consistency
 * - Provides loading states for smooth user experience
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

// Subscription tier types
export type SubscriptionTier = "free" | "team" | "business" | "enterprise";

// Tier access interface for feature control
export interface TierAccess {
  tier: SubscriptionTier | null;
  canAccessExports: () => boolean;
  canAccessAdvancedAnalytics: () => boolean;
  canAccessCustomDashboards: () => boolean;
  canAccessAI: () => boolean;
  isLoading: boolean;
}

/**
 * Main tier management hook - evaluates subscription-based permissions
 */
export function useUserTier(): TierAccess {
  const { profile, loading } = useAuth();

  const tierAccess = useMemo((): TierAccess => {
    // Handle loading state - default to no access
    if (loading) {
      return {
        tier: null,
        canAccessExports: () => false,
        canAccessAdvancedAnalytics: () => false,
        canAccessCustomDashboards: () => false,
        canAccessAI: () => false,
        isLoading: true,
      };
    }

    // Handle unauthenticated users - treat as free tier
    if (!profile) {
      return {
        tier: "free",
        canAccessExports: () => false,
        canAccessAdvancedAnalytics: () => false,
        canAccessCustomDashboards: () => false,
        canAccessAI: () => false,
        isLoading: false,
      };
    }

    // Get user's subscription tier (with fallback to 'free')
    const currentTier = (profile as any).subscription_tier || "free";

    // Helper function to check if current tier meets minimum requirement
    const meetsMinimumTier = (requiredTier: SubscriptionTier): boolean => {
      const tierHierarchy = ["free", "team", "business", "enterprise"];
      const currentIndex = tierHierarchy.indexOf(currentTier);
      const requiredIndex = tierHierarchy.indexOf(requiredTier);
      return currentIndex >= requiredIndex;
    };

    return {
      tier: currentTier,
      
      // Export access: team tier and above
      canAccessExports: () => meetsMinimumTier("team"),
      
      // Advanced analytics: business tier and above
      canAccessAdvancedAnalytics: () => meetsMinimumTier("business"),
      
      // Custom dashboards: business tier and above
      canAccessCustomDashboards: () => meetsMinimumTier("business"),
      
      // AI features: enterprise tier
      canAccessAI: () => meetsMinimumTier("enterprise"),
      
      isLoading: false,
    };
  }, [profile, loading]);

  return tierAccess;
}

/**
 * Utility function to get user-friendly tier display names
 */
export function getTierDisplayName(tier: SubscriptionTier | null): string {
  switch (tier) {
    case "free":
      return "Free";
    case "team":
      return "Team";
    case "business":
      return "Business";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

/**
 * Utility function to get tier feature limits
 */
export function getTierFeatures(tier: SubscriptionTier | null): {
  exports: boolean;
  advancedAnalytics: boolean;
  customDashboards: boolean;
  aiFeatures: boolean;
  maxUsers?: number;
  maxDashboards?: number;
} {
  switch (tier) {
    case "team":
      return {
        exports: true,
        advancedAnalytics: false,
        customDashboards: false,
        aiFeatures: false,
        maxUsers: 10,
        maxDashboards: 5,
      };
    case "business":
      return {
        exports: true,
        advancedAnalytics: true,
        customDashboards: true,
        aiFeatures: false,
        maxUsers: 50,
        maxDashboards: 25,
      };
    case "enterprise":
      return {
        exports: true,
        advancedAnalytics: true,
        customDashboards: true,
        aiFeatures: true,
        // Unlimited for enterprise
      };
    case "free":
    default:
      return {
        exports: false,
        advancedAnalytics: false,
        customDashboards: false,
        aiFeatures: false,
        maxUsers: 1,
        maxDashboards: 3,
      };
  }
}