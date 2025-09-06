/**
 * ============================================================================
 * USAGE INDICATOR - Progress bars and gentle limit warnings
 * ============================================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react';

interface UsageIndicatorProps {
  title: string;
  used: number;
  limit: number;
  unit?: string;
  onUpgrade?: () => void;
  upgradeMessage?: string;
  className?: string;
}

export function UsageIndicator({
  title,
  used,
  limit,
  unit = 'items',
  onUpgrade,
  upgradeMessage = 'Upgrade for unlimited access',
  className = ''
}: UsageIndicatorProps) {
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const isApproaching = percentage >= 80;
  const isNearLimit = percentage >= 95;
  const isAtLimit = used >= limit;

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-600';
    if (isNearLimit) return 'text-orange-600';
    if (isApproaching) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-orange-500';
    if (isApproaching) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getMessage = () => {
    if (isAtLimit) return `You've reached your ${limit} ${unit} limit`;
    if (isNearLimit) return `Almost at your limit (${percentage}%)`;
    if (isApproaching) return `Approaching your limit (${percentage}%)`;
    return `${used} of ${limit} ${unit} used`;
  };

  return (
    <Card className={`${className} ${isAtLimit ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {(isApproaching || isAtLimit) && (
          <AlertTriangle className={`h-4 w-4 ${getStatusColor()}`} />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {used}
            </span>
            <Badge variant="outline" className="text-xs">
              of {limit}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getMessage()}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Upgrade prompt for approaching/at limit */}
          {(isApproaching || isAtLimit) && onUpgrade && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {upgradeMessage}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2 text-xs"
                  onClick={onUpgrade}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}

          {/* Positive messaging for good usage */}
          {!isApproaching && used > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>Great progress! Keep capturing insights.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactUsageIndicatorProps {
  used: number;
  limit: number;
  unit?: string;
  className?: string;
}

export function CompactUsageIndicator({
  used,
  limit,
  unit = '',
  className = ''
}: CompactUsageIndicatorProps) {
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const isNearLimit = percentage >= 90;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {used} of {limit} {unit}
          </span>
          <span className={`font-medium ${isNearLimit ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              isNearLimit ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      {isNearLimit && (
        <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
      )}
    </div>
  );
}