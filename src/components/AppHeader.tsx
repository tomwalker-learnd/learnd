// src/components/AppHeader.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
// If you have shadcn Avatar, uncomment these 2 lines:
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { LogOut } from "lucide-react";

export default function AppHeader() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1) While auth is initializing, render a minimal, non-crashy shell
  if (loading) {
    return (
      <header className="border-b bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <Link to="/" className="font-semibold">Learnd</Link>
          <div className="text-xs text-muted-foreground">Checking session…</div>
        </div>
      </header>
    );
  }

  // 2) Not signed in → render a simple public header (NO user fields)
  if (!user) {
    return (
      <header className="border-b bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <Link to="/" className="font-semibold">Learnd</Link>
          <nav className="flex items-center gap-2">
            {/* If your login page is /auth */}
            <Link to="/auth">
              <Button size="sm" variant="default">Sign in</Button>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // 3) Signed in → safe to read user fields (always null-check)
  const email = user.email ?? "user";
  const initials =
    (email?.[0]?.toUpperCase() ?? "U") +
    (email?.split("@")[0]?.[1]?.toUpperCase() ?? "");

  const onLogout = async () => {
    await signOut();
    // Send to auth page only if you’re not already there
    if (location.pathname !== "/auth") navigate("/auth", { replace: true });
  };

  return (
    <header className="border-b bg-background/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold">Learnd</Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/dashboards" className="hover:underline">Dashboards</Link>
            <Link to="/dashboards/customize" className="hover:underline">Customize</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* If you have Avatar component, use it; otherwise simple fallback circle */}
          {/* <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar> */}
          <div
            aria-label="avatar"
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium"
            title={email}
          >
            {initials}
          </div>
          <span className="hidden sm:inline text-sm text-muted-foreground">{email}</span>
          <Button size="sm" variant="outline" onClick={onLogout}>
            {/* <LogOut className="mr-1 h-4 w-4" /> */}
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
