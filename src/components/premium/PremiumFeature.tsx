/**
 * ============================================================================
 * PREMIUM FEATURE WRAPPER - Conditional content based on subscription tier
 * ============================================================================
 * 
 * FEATURES:
 * - Tier-based access control for wrapped content
 * - Automatic upgrade prompts for insufficient access
 * - Flexible children rendering based on permissions
 * - Integrates with useUserTier hook for consistent access checks
 */

import { ReactNode, useState } from "react";
import { useUserTier, SubscriptionTier } from "@/hooks/useUserTier";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PremiumFeatureProps {
  requiredTier: SubscriptionTier;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export default function PremiumFeature({
  requiredTier,
  children,
  fallback,
  showUpgradePrompt = true,
}: PremiumFeatureProps) {
  const { tier, isLoading } = useUserTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Helper to check if current tier meets minimum requirement
  const hasAccess = (): boolean => {
    if (!tier) return false;
    
    const tierHierarchy = ["free", "team", "business", "enterprise"];
    const currentIndex = tierHierarchy.indexOf(tier);
    const requiredIndex = tierHierarchy.indexOf(requiredTier);
    
    return currentIndex >= requiredIndex;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-24"></div>
      </div>
    );
  }

  // Show content if user has access
  if (hasAccess()) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show default upgrade prompt
  if (showUpgradePrompt) {
    return (
      <>
        <Button
          variant="outline"
          className="text-muted-foreground border-dashed hover:border-primary/50"
          onClick={() => setShowUpgradeModal(true)}
        >
          <Lock className="h-4 w-4 mr-2" />
          Unlock {requiredTier} features
        </Button>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          featureType="premium-features"
        />
      </>
    );
  }

  // Return nothing if no upgrade prompt requested
  return null;
}