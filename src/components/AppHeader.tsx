// src/components/AppHeader.tsx
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { user, loading, signOut } = useAuth();

  // Hide header until auth state is known (prevents flicker)
  if (loading) return null;

  const email = user?.email ?? "";
  const namePart = email.split("@")[0] || "";
  const parts = namePart.split(".");
  const initials =
    (namePart[0]?.toUpperCase() ?? "?") +
    ((parts[1]?.[0]?.toUpperCase() ?? "") || "");

  const onLogout = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-background/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold">Learnd</Link>
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <Link to="/" className="px-2 py-1 rounded-md hover:underline">Home</Link>
            <Link to="/dashboards" className="px-2 py-1 rounded-md hover:underline">Dashboards</Link>
            <Link to="/lessons" className="px-2 py-1 rounded-md hover:underline">Lessons</Link>
            <Link to="/analytics" className="px-2 py-1 rounded-md hover:underline">Analytics</Link>
            {/* No "Customize" in nav anymore */}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-3">
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
        )}
      </div>
    </header>
  );
}
