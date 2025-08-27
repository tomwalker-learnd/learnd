import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function AppHeader() {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // While auth initializes, render a thin shell (no user reads)
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

  // Public (no user) — simple header with Sign in
  if (!user) {
    return (
      <header className="border-b bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <div className="font-semibold">Learnd</div>
          <Button size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
        </div>
      </header>
    );
  }

  // Authenticated
  const email = user.email ?? "user";
  const initials =
    (email[0]?.toUpperCase() ?? "U") +
    (email.split("@")[0]?.[1]?.toUpperCase() ?? "");

  const link = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "px-2 py-1 rounded-md text-sm",
          isActive ? "font-medium" : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {label}
    </NavLink>
  );

  const onLogout = async () => {
    await signOut();
    if (pathname !== "/auth") navigate("/auth", { replace: true });
  };

  return (
    <header className="border-b bg-background/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-semibold">Learnd</div>
          <nav className="hidden sm:flex items-center gap-1">
            {link("/", "Home")}
            {link("/dashboards", "Dashboards")}
            {link("/dashboards/customize", "Customize")}
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
