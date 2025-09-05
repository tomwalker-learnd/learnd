/**
 * ============================================================================
 * DEV ROLE SWITCHER - Temporary testing component for user tier restrictions
 * ============================================================================
 * 
 * FEATURES:
 * - Quick Role Switching: Toggle between user roles instantly
 * - Subscription Tier Testing: Switch between subscription tiers
 * - Visual Feedback: Shows current role, tier, and permission status
 * - Database Updates: Automatically updates user profile in Supabase
 * - Dev-Only Component: Easy to remove when no longer needed
 * - Real-Time Updates: Immediately reflects permission changes in UI
 * 
 * USAGE:
 * - Add to App.tsx or any page for quick testing access
 * - Click role/tier buttons to switch between different access levels
 * - Permissions will update immediately throughout the app
 * - Remove this component before production deployment
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Users, Crown, Zap, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, getTierDisplayName as getPermissionTierDisplayName } from "@/hooks/usePermissions";
import { useUserTier, getTierDisplayName, type SubscriptionTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RoleSwitcher() {
  const { profile } = useAuth();
  const { tier: permissionTier, canExport, canAccessPremiumFeatures } = usePermissions();
  const { tier, canAccessExports, canAccessAdvancedAnalytics, canAccessCustomDashboards, canAccessAI } = useUserTier();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle role switching - updates database and shows feedback
  const handleRoleSwitch = async (newRole: 'basic_user' | 'power_user' | 'admin') => {
    if (!profile?.id || newRole === profile.role) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(`Switched to ${getRoleDisplayName(newRole)} role`);
      
      // Refresh to update all components
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to switch role');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle subscription tier switching
  const handleTierSwitch = async (newTier: SubscriptionTier) => {
    if (!profile?.id || newTier === tier) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(`Switched to ${getTierDisplayName(newTier)} tier`);
      
      // Refresh to update all components
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error('Failed to switch tier');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get user-friendly role display names
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'basic_user': return 'Basic User';
      case 'power_user': return 'Power User';  
      case 'admin': return 'Admin';
      default: return 'Unknown';
    }
  };

  // Get role-specific icons
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'basic_user': return <Users className="h-4 w-4" />;
      case 'power_user': return <Zap className="h-4 w-4" />;
      case 'admin': return <Crown className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  if (!profile) return null;

  return (
    <TooltipProvider>
      <Card className={`fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-lg z-50 transition-all duration-300 ${
        isCollapsed ? 'w-64' : 'w-80'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Dev Role Switcher
            </div>
            
            {/* COLLAPSE/EXPAND BUTTON - Corner button with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 w-6 p-0 hover:bg-muted/50"
                >
                  {isCollapsed ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isCollapsed ? 'Expand' : 'Collapse'}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          
          {/* DESCRIPTION - Only show when expanded */}
          {!isCollapsed && (
            <CardDescription className="text-xs">
              Switch user roles and subscription tiers to test permissions
            </CardDescription>
          )}
        </CardHeader>
        
        {/* EXPANDED CONTENT - Only show when not collapsed */}
        {!isCollapsed && (
          <CardContent className="space-y-4">
            {/* CURRENT STATUS - Shows active role, tier, and permissions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Current Status:</span>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    <span className="flex items-center gap-1">
                      {getRoleIcon(profile.role)}
                      {getRoleDisplayName(profile.role)}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getTierDisplayName(tier)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Exports:</span>
                  <Badge variant={canAccessExports() ? 'default' : 'destructive'} className="text-xs px-2 py-0">
                    {canAccessExports() ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Analytics:</span>
                  <Badge variant={canAccessAdvancedAnalytics() ? 'default' : 'destructive'} className="text-xs px-2 py-0">
                    {canAccessAdvancedAnalytics() ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dashboards:</span>
                  <Badge variant={canAccessCustomDashboards() ? 'default' : 'destructive'} className="text-xs px-2 py-0">
                    {canAccessCustomDashboards() ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Features:</span>
                  <Badge variant={canAccessAI() ? 'default' : 'destructive'} className="text-xs px-2 py-0">
                    {canAccessAI() ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* USER ROLE SWITCHING BUTTONS */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">User Role:</span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={profile.role === 'basic_user' ? 'default' : 'outline'}
                  onClick={() => handleRoleSwitch('basic_user')}
                  disabled={isUpdating || profile.role === 'basic_user'}
                  className="text-xs h-8"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Basic
                </Button>
                
                <Button
                  size="sm"
                  variant={profile.role === 'power_user' ? 'default' : 'outline'}
                  onClick={() => handleRoleSwitch('power_user')}
                  disabled={isUpdating || profile.role === 'power_user'}
                  className="text-xs h-8"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Power
                </Button>
                
                <Button
                  size="sm"
                  variant={profile.role === 'admin' ? 'default' : 'outline'}
                  onClick={() => handleRoleSwitch('admin')}
                  disabled={isUpdating || profile.role === 'admin'}
                  className="text-xs h-8"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Button>
              </div>
            </div>

            {/* SUBSCRIPTION TIER SWITCHING BUTTONS */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Subscription Tier:</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={tier === 'free' ? 'default' : 'outline'}
                  onClick={() => handleTierSwitch('free')}
                  disabled={isUpdating || tier === 'free'}
                  className="text-xs h-8"
                >
                  Free
                </Button>
                
                <Button
                  size="sm"
                  variant={tier === 'team' ? 'default' : 'outline'}
                  onClick={() => handleTierSwitch('team')}
                  disabled={isUpdating || tier === 'team'}
                  className="text-xs h-8"
                >
                  Team
                </Button>
                
                <Button
                  size="sm"
                  variant={tier === 'business' ? 'default' : 'outline'}
                  onClick={() => handleTierSwitch('business')}
                  disabled={isUpdating || tier === 'business'}
                  className="text-xs h-8"
                >
                  Business
                </Button>
                
                <Button
                  size="sm"
                  variant={tier === 'enterprise' ? 'default' : 'outline'}
                  onClick={() => handleTierSwitch('enterprise')}
                  disabled={isUpdating || tier === 'enterprise'}
                  className="text-xs h-8"
                >
                  Enterprise
                </Button>
              </div>
            </div>

            {/* DEV WARNING - Reminder to remove before production */}
            <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ Remove this component before production deployment
              </p>
            </div>
          </CardContent>
        )}

        {/* COLLAPSED CONTENT - Show compact status when collapsed */}
        {isCollapsed && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  <span className="flex items-center gap-1">
                    {getRoleIcon(profile.role)}
                    {getRoleDisplayName(profile.role)}
                  </span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getTierDisplayName(tier)}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}