import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut?.();
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  const initial = (user?.email || user?.user_metadata?.full_name || "U")
    .toString()
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="h-12 flex items-center justify-between">
          {/* Left: Logo + Tagline */}
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src="/brand/learnd-logo-v8_Lgt.png"
              alt="Learnd"
              className="h-6 w-auto"
            />
            <span className="hidden sm:inline text-sm sm:text-base text-muted-foreground">
              Learn. Improve. Repeat.
            </span>
          </Link>

          {/* Right: Nav + User */}
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-5 text-sm mr-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/dashboards"
                className={({ isActive }) =>
                  `hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`
                }
              >
                Dashboards
              </NavLink>
              <NavLink
                to="/submit"
                className={({ isActive }) =>
                  `hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`
                }
              >
                Capture
              </NavLink>
              <NavLink
                to="/lessons"
                className={({ isActive }) =>
                  `hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`
                }
              >
                Lessons
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`
                }
              >
                Analytics
              </NavLink>
            </nav>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 rounded-full p-0" aria-label="User menu">
                    <span className="inline-flex h-full w-full items-center justify-center text-sm font-medium">
                      {initial}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    {user.email || user.user_metadata?.full_name || "Signed in"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/">Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboards">Dashboards</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboards/customize">Create Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/submit">Capture New Lesson</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/lessons">My Lessons</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/analytics">Analytics</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
