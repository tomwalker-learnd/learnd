/**
 * ============================================================================
 * UPGRADE PROMPT MODAL - Subscription tier upgrade interface
 * ============================================================================
 * 
 * FEATURES:
 * - Permission Gate: Blocks premium features for free tier users
 * - Feature Showcase: Highlights export capabilities and premium benefits
 * - Upgrade Flow: Redirects to subscription page for plan upgrade
 * - Responsive Design: Works across all device sizes
 * - Visual Hierarchy: Clear pricing and feature comparison
 * - User Experience: Non-intrusive modal with clear value proposition
 * 
 * USAGE:
 * - Triggered when free users attempt to access export functionality
 * - Can be extended for other premium features beyond export
 * - Integrates with permission system from usePermissions hook
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, FileSpreadsheet, FileText } from "lucide-react";

interface UpgradePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: "export" | "general"; // Feature type for customized messaging
}

export default function UpgradePromptModal({ 
  open, 
  onOpenChange, 
  featureType = "export" 
}: UpgradePromptModalProps) {
  // Handle upgrade button click - redirects to subscription management
  const handleUpgrade = () => {
    // TODO: Implement upgrade flow - redirect to subscription page
    window.open('/subscription', '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-semibold">
            Unlock Export Features
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Export functionality is available with our premium plans. Upgrade to access powerful data export tools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PREMIUM FEATURES SHOWCASE - Highlights export capabilities */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Premium Export Features
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Export to CSV format</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Export to PDF reports</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Unlimited export records</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Advanced filtering before export</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Custom report templates</span>
              </div>
            </div>
          </div>

          {/* PRICING PLAN - Clear value proposition with pricing */}
          <div className="grid grid-cols-1 gap-3 pt-4">
            <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">Power User</h5>
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Full export access + advanced features</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">$19</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS - Clear upgrade path with dismissal option */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button className="flex-1" onClick={handleUpgrade}>
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}