// src/components/AppHeader.tsx (minimal, safe)
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <header className="border-b bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <div className="font-semibold">Learnd</div>
          <div className="text-xs text-muted-foreground">Checking session…</div>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="border-b bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <div className="font-semibold">Learnd</div>
          <a href="/auth">
            <Button size="sm">Sign in</Button>
          </a>
        </div>
      </header>
    );
  }

  const email = user.email ?? "user";
  const initials =
    (email[0]?.toUpperCase() ?? "U") +
    (email.split("@")[0]?.[1]?.toUpperCase() ?? "");

  const onLogout = async () => {
    await signOut();
    // Use hard redirect to avoid router hook issues
    window.location.assign("/auth");
  };

  return (
    <header className="border-b bg-background/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="font-semibold">Learnd</a>
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <a href="/" className="px-2 py-1 rounded-md hover:underline">Home</a>
            <a href="/dashboards" className="px-2 py-1 rounded-md hover:underline">Dashboards</a>
            <a href="/dashboards/customize" className="px-2 py-1 rounded-md hover:underline">Customize</a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div
            aria-label="avatar"
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium"
            title={email}
          >
            {initials}
          </div>
          <span className="hidden md:inline text-sm text-muted-foreground">{email}</span>
          <Button size="sm" variant="outline" onClick={onLogout}>Sign out</Button>
        </div>
      </div>
    </header>
  );
}
