/**
 * ============================================================================
 * FEATURE RESTRICTION - Contextual blocking with upgrade prompts
 * ============================================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

interface FeatureRestrictionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  restrictionType: 'blur' | 'block' | 'limit';
  upgradeContext: 'exports' | 'ai_analysis' | 'advanced_analytics' | 'custom_dashboards' | 'data_retention' | 'lessons_limit' | 'general';
  requiredTier: 'team' | 'business' | 'enterprise';
  previewMessage?: string;
  usageInfo?: {
    used: number;
    limit: number;
  };
  className?: string;
}

export default function FeatureRestriction({
  title,
  description,
  children,
  restrictionType,
  upgradeContext,
  requiredTier,
  previewMessage = "This feature is available with a premium plan",
  usageInfo,
  className = ''
}: FeatureRestrictionProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const tierDisplayNames = {
    team: 'Team',
    business: 'Business', 
    enterprise: 'Enterprise'
  };

  const tierColors = {
    team: 'bg-blue-100 text-blue-800 border-blue-200',
    business: 'bg-purple-100 text-purple-800 border-purple-200',
    enterprise: 'bg-amber-100 text-amber-800 border-amber-200'
  };

  if (restrictionType === 'blur') {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {title}
                <Badge className={tierColors[requiredTier]}>
                  {tierDisplayNames[requiredTier]}+
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
            >
              {isPreviewExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreviewExpanded ? 'Hide' : 'Preview'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          {/* Blurred content */}
          <div className={`transition-all duration-300 ${!isPreviewExpanded ? 'blur-sm' : ''}`}>
            {children}
          </div>
          
          {/* Overlay when blurred */}
          {!isPreviewExpanded && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center p-6 bg-background border border-primary/20 rounded-lg shadow-lg">
                <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Premium Feature</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  {previewMessage}
                </p>
                <Button onClick={() => setShowUpgradeModal(true)} className="w-full">
                  Unlock {tierDisplayNames[requiredTier]}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          context={upgradeContext}
          currentUsage={usageInfo ? {
            used: usageInfo.used,
            limit: usageInfo.limit,
            percentage: Math.round((usageInfo.used / usageInfo.limit) * 100)
          } : undefined}
        />
      </Card>
    );
  }

  if (restrictionType === 'block') {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {description}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Available with</span>
            <Badge className={tierColors[requiredTier]}>
              {tierDisplayNames[requiredTier]}+ Plan
            </Badge>
          </div>
          <Button onClick={() => setShowUpgradeModal(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to {tierDisplayNames[requiredTier]}
          </Button>
        </CardContent>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          context={upgradeContext}
          currentUsage={usageInfo ? {
            used: usageInfo.used,
            limit: usageInfo.limit,
            percentage: Math.round((usageInfo.used / usageInfo.limit) * 100)
          } : undefined}
        />
      </Card>
    );
  }

  if (restrictionType === 'limit') {
    return (
      <Card className={`border-amber-200 bg-amber-50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lock className="h-5 w-5" />
            {title} - Limit Reached
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 mb-4">{description}</p>
          
          {usageInfo && (
            <div className="mb-4 p-3 bg-amber-100 rounded-lg">
              <div className="flex justify-between text-sm font-medium text-amber-800 mb-1">
                <span>{usageInfo.used} of {usageInfo.limit} used</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full w-full" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1"
            >
              See Upgrade Options
            </Button>
            <Button onClick={() => setShowUpgradeModal(true)} className="flex-1">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          context={upgradeContext}
          currentUsage={usageInfo ? {
            used: usageInfo.used,
            limit: usageInfo.limit,
            percentage: Math.round((usageInfo.used / usageInfo.limit) * 100)
          } : undefined}
        />
      </Card>
    );
  }

  return <div className={className}>{children}</div>;
}