// src/components/AppHeader.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/learnd-logo.png";

export default function AppHeader() {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <header className="border-b bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Learnd" className="h-6 w-auto" />
            <span className="sr-only">Learnd</span>
          </div>
          <div className="text-xs text-muted-foreground">Checking session…</div>
        </div>
      </header>
    );
  }

  const email = user?.email ?? "";
  const namePart = email.split("@")[0] || "";
  const parts = namePart.split(".");
  const initials =
    (namePart[0]?.toUpperCase() ?? "?") +
    ((parts[1]?.[0]?.toUpperCase() ?? "") || "");

  const onLogout = async () => {
    await signOut();
  };

  const NavLink = ({
    to,
    label,
  }: {
    to: string;
    label: string;
  }) => {
    const active =
      pathname === to ||
      (to !== "/" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`px-2 py-1 rounded-md text-sm ${
          active ? "underline" : "hover:underline"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b bg-background/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Learnd" className="h-6 w-auto" />
            <span className="sr-only">Learnd</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-2">
            <NavLink to="/" label="Home" />
            <NavLink to="/dashboards" label="Dashboards" />
            <NavLink to="/lessons" label="Lessons" />
            <NavLink to="/analytics" label="Analytics" />
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
            <span className="hidden md:inline text-sm text-muted-foreground">
              {email}
            </span>
            <Button size="sm" variant="outline" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
