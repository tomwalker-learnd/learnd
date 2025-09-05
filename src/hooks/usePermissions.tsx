import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

export type UserTier = "free" | "paid" | "admin";

export interface UserPermissions {
  tier: UserTier;
  canExport: boolean;
  canAccessPremiumFeatures: boolean;
  isLoading: boolean;
}

/**
 * Hook to check user permissions based on their profile role
 * Maps profile roles to subscription tiers:
 * - basic_user = free tier (limited features)
 * - power_user = paid tier (full features)  
 * - admin = admin tier (all features)
 */
export function usePermissions(): UserPermissions {
  const { profile, loading } = useAuth();

  const permissions = useMemo((): UserPermissions => {
    if (loading) {
      return {
        tier: "free",
        canExport: false,
        canAccessPremiumFeatures: false,
        isLoading: true,
      };
    }

    // No profile means not authenticated - treat as free tier
    if (!profile) {
      return {
        tier: "free",
        canExport: false,
        canAccessPremiumFeatures: false,
        isLoading: false,
      };
    }

    // Map profile roles to tiers and permissions
    switch (profile.role) {
      case "admin":
        return {
          tier: "admin",
          canExport: true,
          canAccessPremiumFeatures: true,
          isLoading: false,
        };
      
      case "power_user":
        return {
          tier: "paid",
          canExport: true,
          canAccessPremiumFeatures: true,
          isLoading: false,
        };
      
      case "basic_user":
      default:
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
 * Utility function to get user tier display name
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