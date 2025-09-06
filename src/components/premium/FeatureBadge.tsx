/**
 * ============================================================================
 * FEATURE BADGE - Tier level indicators for premium features
 * ============================================================================
 * 
 * FEATURES:
 * - Color-coded badges by tier level
 * - Consistent styling across the app
 * - Supports different badge variants and sizes
 * - Uses semantic design tokens for theming
 */

import { Badge, BadgeProps } from "@/components/ui/badge";
import { SubscriptionTier } from "@/hooks/useUserTier";
import { cn } from "@/lib/utils";

interface FeatureBadgeProps extends Omit<BadgeProps, 'variant'> {
  tier: SubscriptionTier;
  showIcon?: boolean;
}

export default function FeatureBadge({
  tier,
  showIcon = false,
  className,
  ...props
}: FeatureBadgeProps) {
  const getBadgeConfig = (tier: SubscriptionTier) => {
    switch (tier) {
      case "team":
        return {
          label: "PRO",
          icon: "✦",
          className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/30 shadow-blue-500/20 shadow-sm",
        };
      case "business":
        return {
          label: "BUSINESS",
          icon: "★",
          className: "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400/30 shadow-purple-500/20 shadow-sm",
        };
      case "enterprise":
        return {
          label: "ENTERPRISE",
          icon: "♦",
          className: "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/30 shadow-amber-500/20 shadow-sm",
        };
      default:
        return {
          label: "FREE",
          icon: "○",
          className: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const config = getBadgeConfig(tier);

  return (
    <Badge
      className={cn(
        "text-xs font-semibold px-2 py-0.5 select-none",
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}