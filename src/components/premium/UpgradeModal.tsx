/**
 * ============================================================================
 * UPGRADE MODAL - Contextual upgrade prompts with value propositions
 * ============================================================================
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Zap, Brain, BarChart3, Download, Shield } from 'lucide-react';

type UpgradeContext = 
  | 'exports'
  | 'ai_analysis' 
  | 'advanced_analytics'
  | 'custom_dashboards'
  | 'data_retention'
  | 'lessons_limit'
  | 'general';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: UpgradeContext;
  feature?: string;
  currentUsage?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

const contextData = {
  exports: {
    title: 'Unlock Powerful Export Capabilities',
    description: 'Generate professional reports and share insights with stakeholders',
    icon: <Download className="h-6 w-6 text-primary" />,
    value: 'Save 5+ hours per week on manual reporting',
    features: [
      'PDF executive summaries',
      'Detailed CSV exports', 
      'Custom report templates',
      'Scheduled report delivery',
      'White-label branding'
    ]
  },
  ai_analysis: {
    title: 'AI-Powered Analysis Worth $20/User',
    description: 'Unlock predictive insights and automated pattern detection',
    icon: <Brain className="h-6 w-6 text-primary" />,
    value: 'AI analysis that pays for itself with one prevented project failure',
    features: [
      'Automated risk detection',
      'Success pattern identification', 
      'Predictive project outcomes',
      'Smart intervention recommendations',
      'Custom AI models for your data'
    ]
  },
  advanced_analytics: {
    title: 'Advanced Analytics & Insights',
    description: 'Deep dive into project performance with comprehensive analytics',
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    value: 'Make data-driven decisions that improve project success rates by 40%',
    features: [
      'Interactive performance dashboards',
      'Trend analysis and forecasting',
      'Client satisfaction tracking',
      'Budget and timeline analytics',
      'Benchmarking and KPI monitoring'
    ]
  },
  custom_dashboards: {
    title: 'Custom Dashboards & Views',
    description: 'Build personalized dashboards for different stakeholders',
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    value: 'Tailored insights for executives, teams, and clients',
    features: [
      'Drag-and-drop dashboard builder',
      'Role-based view customization',
      'Real-time performance widgets',
      'Branded client portals',
      'Mobile-optimized layouts'
    ]
  },
  data_retention: {
    title: 'Extended Data Retention',
    description: 'Keep your project history and build long-term insights',
    icon: <Shield className="h-6 w-6 text-primary" />,
    value: 'Historical analysis reveals patterns that drive future success',
    features: [
      'Unlimited data retention',
      'Historical trend analysis',
      'Year-over-year comparisons',
      'Long-term pattern recognition',
      'Compliance and audit trails'
    ]
  },
  lessons_limit: {
    title: 'Unlimited Project Insights',
    description: 'Capture lessons from every project without limits',
    icon: <Zap className="h-6 w-6 text-primary" />,
    value: 'Never miss capturing valuable project learnings again',
    features: [
      'Unlimited lesson capture',
      'Bulk import capabilities',
      'Team collaboration features',
      'Advanced search and filtering',
      'Integration with project tools'
    ]
  },
  general: {
    title: 'Upgrade Your Project Intelligence',
    description: 'Unlock the full power of data-driven project management',
    icon: <Star className="h-6 w-6 text-primary" />,
    value: 'Join 500+ teams improving project success rates',
    features: [
      'All premium features included',
      'Priority customer support',
      'Advanced integrations',
      'Custom onboarding',
      'Success manager included'
    ]
  }
};

const pricingTiers = [
  {
    name: 'Team',
    price: 15,
    description: 'Perfect for growing teams',
    features: ['Unlimited lessons', 'Export capabilities', 'Team collaboration', '1-year data retention'],
    popular: false,
    tier: 'team'
  },
  {
    name: 'Business', 
    price: 29,
    description: 'Advanced analytics and insights',
    features: ['Everything in Team', 'AI-powered analysis', 'Custom dashboards', 'Advanced analytics', '3-year retention'],
    popular: true,
    tier: 'business'
  },
  {
    name: 'Enterprise',
    price: 49,
    description: 'Complete project intelligence platform',
    features: ['Everything in Business', 'Custom AI models', 'White-label solutions', 'Dedicated support', 'Unlimited retention'],
    popular: false,
    tier: 'enterprise'
  }
];

export default function UpgradeModal({ 
  open, 
  onOpenChange, 
  context, 
  feature,
  currentUsage 
}: UpgradeModalProps) {
  const contextInfo = contextData[context] || contextData.general;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            {contextInfo.icon}
          </div>
          <DialogTitle className="text-2xl">{contextInfo.title}</DialogTitle>
          <DialogDescription className="text-lg">
            {contextInfo.description}
          </DialogDescription>
          
          {/* Usage indicator for limit-based contexts */}
          {currentUsage && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-800">
                  {currentUsage.used} of {currentUsage.limit} used
                </span>
                <span className="text-amber-600">{currentUsage.percentage}%</span>
              </div>
              <div className="mt-2 w-full bg-amber-200 rounded-full h-2">
                <div 
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(currentUsage.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Value Proposition */}
        <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <Zap className="h-4 w-4" />
            {contextInfo.value}
          </div>
        </div>

        {/* Feature List */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">What you'll unlock:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {contextInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative border rounded-lg p-4 ${
                tier.popular 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              {tier.popular && (
                <Badge 
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
                >
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className="font-semibold text-lg">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
              </div>

              <div className="mt-4 space-y-2">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full mt-4" 
                variant={tier.popular ? 'default' : 'outline'}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center py-4 border-t">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>500+ teams</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>40% success improvement</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
          <Button className="flex-1">
            Start Free Trial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}