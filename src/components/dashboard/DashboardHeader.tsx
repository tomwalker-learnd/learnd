import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';


export function DashboardHeader() {
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'power_user':
        return 'default';
      case 'basic_user':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'power_user':
        return 'Power User';
      case 'basic_user':
        return 'Basic User';
      default:
        return 'User';
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/learnd-logo-v5.svg" 
              alt="Learnd Logo" 
              className="h-6 w-auto sm:h-7" 
            />
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground">Project Learning Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile?.email || 'User'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.email}</span>
                  {profile?.role && (
                    <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                      {getRoleDisplayName(profile.role)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}