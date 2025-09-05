/**
 * ============================================================================
 * UPGRADE MODAL - Feature comparison and upgrade CTA
 * ============================================================================
 * 
 * FEATURES:
 * - Feature comparison table showing free vs paid tier benefits
 * - Highlights export functionality and other premium features
 * - Call-to-action button for upgrades
 * - Uses shadcn/ui modal components with semantic design tokens
 */

import { Check, X, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType?: string;
}

export default function UpgradeModal({ 
  open, 
  onOpenChange, 
  featureType = "export" 
}: UpgradeModalProps) {
  const handleUpgrade = () => {
    // Close modal and redirect to subscription page
    onOpenChange(false);
    // TODO: Add actual subscription/billing integration
    window.open('/subscribe', '_blank');
  };

  const features = [
    {
      feature: "View lessons learned",
      free: true,
      paid: true,
    },
    {
      feature: "Basic filtering & search",
      free: true,
      paid: true,
    },
    {
      feature: "CSV & PDF exports",
      free: false,
      paid: true,
    },
    {
      feature: "Advanced analytics",
      free: false,
      paid: true,
    },
    {
      feature: "Custom dashboards",
      free: false,
      paid: true,
    },
    {
      feature: "AI insights",
      free: false,
      paid: true,
    },
    {
      feature: "Unlimited records",
      free: false,
      paid: true,
    },
    {
      feature: "Priority support",
      free: false,
      paid: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-base">
            Get access to powerful export tools and advanced analytics to maximize your lessons learned insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature highlights section */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/20">
            <h3 className="font-semibold text-lg mb-3">Premium Export Features</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Export unlimited records to CSV & PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Advanced filtering options in exports</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Custom export templates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Scheduled automated exports</span>
              </div>
            </div>
          </div>

          {/* Feature comparison table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-semibold">Features</div>
                <div className="text-center">
                  <Badge variant="outline" className="bg-background">
                    Free
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge className="bg-primary text-primary-foreground">
                    Team Plan
                  </Badge>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {features.map((item, index) => (
                <div key={index} className="px-4 py-3">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-sm">{item.feature}</div>
                    <div className="text-center">
                      {item.free ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </div>
                    <div className="text-center">
                      {item.paid ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing section */}
          <div className="text-center space-y-4">
            <div>
              <div className="text-3xl font-bold">$29<span className="text-lg text-muted-foreground">/month</span></div>
              <p className="text-sm text-muted-foreground">Team Plan - Billed monthly</p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="px-6"
              >
                Maybe Later
              </Button>
              <Button 
                onClick={handleUpgrade}
                className="px-6 bg-primary hover:bg-primary/90"
              >
                Upgrade Now
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            30-day money-back guarantee • Cancel anytime • No setup fees
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}