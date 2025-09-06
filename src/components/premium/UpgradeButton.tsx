/**
 * ============================================================================
 * UPGRADE BUTTON - Reusable CTA for subscription upgrades
 * ============================================================================
 * 
 * FEATURES:
 * - Dynamic messaging based on current tier
 * - Configurable button styles and sizes
 * - Integrates with upgrade modal or external billing
 * - Supports different upgrade contexts
 */

import { useState } from "react";
import { useUserTier, getTierDisplayName } from "@/hooks/useUserTier";
import { Button, ButtonProps } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import { ArrowUp, Sparkles } from "lucide-react";

interface UpgradeButtonProps extends Omit<ButtonProps, 'onClick'> {
  context?: string;
  externalUrl?: string;
  showModal?: boolean;
}

export default function UpgradeButton({
  context = "premium",
  externalUrl,
  showModal = true,
  variant = "gradient",
  className,
  children,
  ...props
}: UpgradeButtonProps) {
  const { tier } = useUserTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank');
      return;
    }

    if (showModal) {
      setShowUpgradeModal(true);
      return;
    }

    // Default fallback - open subscription page
    window.open('/subscribe', '_blank');
  };

  const getButtonText = (): string => {
    if (children) return children.toString();

    switch (tier) {
      case "free":
        return "Upgrade to Pro";
      case "team":
        return "Upgrade to Business";
      case "business":
        return "Upgrade to Enterprise";
      case "enterprise":
        return "Manage Subscription";
      default:
        return "Upgrade Now";
    }
  };

  const getButtonIcon = () => {
    if (tier === "enterprise") {
      return <Sparkles className="h-4 w-4" />;
    }
    return <ArrowUp className="h-4 w-4" />;
  };

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={handleUpgrade}
        {...props}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {showModal && (
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          featureType={context}
        />
      )}
    </>
  );
}