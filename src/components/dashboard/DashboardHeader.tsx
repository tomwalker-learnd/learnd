import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function DashboardHeader({ title, description, actions }: Props) {
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (_) {
      // no-op
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "power_user":
        return "default";
      case "basic_user":
      default:
        return "secondary";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "power_user":
        return "Power User";
      case "basic_user":
        return "Basic User";
      default:
        return "User";
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        {/* Top row: brand + user */}
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/brand/learnd-logo-v6.png"
              alt="Learnd"
              className="h-8 sm:h-12 w-auto"
            />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Learn. Improve. Repeat.
            </span>
          </a>

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
                    : profile?.email || "User"}
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

        {/* Bottom row: page title / actions */}
        {(title || description || actions) && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && <h1 className="text-xl font-semibold">{title}</h1>}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex shrink-0">{actions}</div>}
          </div>
        )}
      </div>
    </header>
  );
}
