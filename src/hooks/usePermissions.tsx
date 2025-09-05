/**
 * ============================================================================
 * USER PERMISSIONS HOOK - Subscription tier-based access control
 * ============================================================================
 * 
 * FEATURES:
 * - Tier Management: Maps database roles to subscription tiers (free/paid/admin)
 * - Permission Gates: Controls access to export and premium features
 * - Loading States: Handles authentication loading gracefully
 * - Role Validation: Validates user roles against known subscription levels
 * - Feature Flags: Centralized permission system for feature access
 * 
 * TIER MAPPING:
 * - basic_user → free tier (limited features)
 * - power_user → paid tier (full export + premium features)
 * - admin → admin tier (unrestricted access)
 * 
 * USAGE:
 * - Used throughout the app to check user permissions before showing features
 * - Integrates with UpgradePromptModal for seamless upgrade flow
 * - Provides loading states for smooth authentication experience
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

// Subscription tier types
export type UserTier = "free" | "paid" | "admin";

// Complete permission interface for feature access control
export interface UserPermissions {
  tier: UserTier; // Current subscription tier
  canExport: boolean; // Export functionality access
  canAccessPremiumFeatures: boolean; // General premium feature access
  isLoading: boolean; // Authentication loading state
}

/**
 * Main permissions hook - evaluates user permissions based on profile role
 */
export function usePermissions(): UserPermissions {
  const { profile, loading } = useAuth();

  const permissions = useMemo((): UserPermissions => {
    // Handle loading state - default to restricted permissions
    if (loading) {
      return {
        tier: "free",
        canExport: false,
        canAccessPremiumFeatures: false,
        isLoading: true,
      };
    }

    // Handle unauthenticated users - treat as free tier
    if (!profile) {
      return {
        tier: "free",
        canExport: false,
        canAccessPremiumFeatures: false,
        isLoading: false,
      };
    }

    // Map database profile roles to application permission tiers
    switch (profile.role) {
      case "admin":
        // Admin tier - unrestricted access to all features
        return {
          tier: "admin",
          canExport: true,
          canAccessPremiumFeatures: true,
          isLoading: false,
        };
      
      case "power_user":
        // Paid tier - full export and premium feature access
        return {
          tier: "paid",
          canExport: true,
          canAccessPremiumFeatures: true,
          isLoading: false,
        };
      
      case "basic_user":
      default:
        // Free tier - limited access, requires upgrade for premium features
        return {
          tier: "free",
          canExport: false,
          canAccessPremiumFeatures: false,
          isLoading: false,
        };
    }
  }, [profile, loading]);

  return permissions;
}

/**
 * Utility function to get user-friendly tier display names
 * Used in UI components for showing current subscription level
 */
export function getTierDisplayName(tier: UserTier): string {
  switch (tier) {
    case "free":
      return "Free";
    case "paid":
      return "Power User";
    case "admin":
      return "Admin";
    default:
      return "Free";
  }
}