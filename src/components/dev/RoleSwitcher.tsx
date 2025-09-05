/**
 * ============================================================================
 * DEV ROLE SWITCHER - Temporary testing component for user tier restrictions
 * ============================================================================
 * 
 * FEATURES:
 * - Quick Role Switching: Toggle between free, paid, and admin tiers instantly
 * - Visual Feedback: Shows current role and permission status
 * - Database Updates: Automatically updates user profile in Supabase
 * - Dev-Only Component: Easy to remove when no longer needed
 * - Real-Time Updates: Immediately reflects permission changes in UI
 * 
 * USAGE:
 * - Add to App.tsx or any page for quick testing access
 * - Click role buttons to switch between tiers
 * - Permissions will update immediately throughout the app
 * - Remove this component before production deployment
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Crown, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, getTierDisplayName } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RoleSwitcher() {
  const { profile } = useAuth();
  const { tier, canExport, canAccessPremiumFeatures } = usePermissions();
  const [isUpdating, setIsUpdating] = useState(false);

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
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to switch role');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get user-friendly role display names
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'basic_user': return 'Free User';
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
    <Card className="fixed bottom-4 right-4 w-80 bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-lg z-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Dev Role Switcher
        </CardTitle>
        <CardDescription className="text-xs">
          Switch user roles to test permission restrictions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* CURRENT STATUS - Shows active role and permissions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Current Role:</span>
            <Badge variant={tier === 'admin' ? 'default' : tier === 'paid' ? 'secondary' : 'outline'}>
              <span className="flex items-center gap-1">
                {getRoleIcon(profile.role)}
                {getTierDisplayName(tier)}
              </span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Export:</span>
              <Badge variant={canExport ? 'default' : 'destructive'} className="text-xs px-2 py-0">
                {canExport ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Premium:</span>
              <Badge variant={canAccessPremiumFeatures ? 'default' : 'destructive'} className="text-xs px-2 py-0">
                {canAccessPremiumFeatures ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* ROLE SWITCHING BUTTONS - Quick access to test different tiers */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Switch to:</span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant={profile.role === 'basic_user' ? 'default' : 'outline'}
              onClick={() => handleRoleSwitch('basic_user')}
              disabled={isUpdating || profile.role === 'basic_user'}
              className="text-xs h-8"
            >
              <Users className="h-3 w-3 mr-1" />
              Free
            </Button>
            
            <Button
              size="sm"
              variant={profile.role === 'power_user' ? 'default' : 'outline'}
              onClick={() => handleRoleSwitch('power_user')}
              disabled={isUpdating || profile.role === 'power_user'}
              className="text-xs h-8"
            >
              <Zap className="h-3 w-3 mr-1" />
              Paid
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

        {/* DEV WARNING - Reminder to remove before production */}
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Remove this component before production deployment
          </p>
        </div>
      </CardContent>
    </Card>
  );
}