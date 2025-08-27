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
            </nav>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {initial}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user.email || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
