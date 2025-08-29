// src/components/AppHeader.tsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Import the bundled asset so it never “goes missing”
import logoUrl from "@/assets/learnd-logo.png";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/dashboards", label: "Dashboards" },
  { to: "/lessons", label: "Lessons" },
  { to: "/analytics", label: "Analytics" },
];

export default function AppHeader() {
  const { user } = useAuth();
  const [logoOk, setLogoOk] = useState(true);

  const linkClasses =
    "text-sm font-medium transition-colors hover:text-foreground data-[active=true]:text-foreground text-foreground/60";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Let the router guard bump them to /auth
    window.location.assign("/auth");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-4">
        {/* Left: Logo + tagline */}
        <Link to="/" className="mr-4 flex items-center gap-3">
          {logoOk ? (
            <img
              src={logoUrl}
              alt="Learnd"
              className="h-8 w-auto"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="text-lg font-semibold tracking-tight">Learnd</span>
          )}

          {/* Tagline (show from sm and up) */}
          <span className="hidden sm:inline-block text-xs text-muted-foreground leading-tight">
            Learn. Improve. Repeat.
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:flex-1 items-center gap-6">
          {NAV_ITEMS.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? "data-[active=true]" : ""}`
              }
              end
            >
              {i.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          <Link to="/analytics">
            <Button className="bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white">
              Analytics
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {user.email?.split("@")[0] ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
          )}
        </div>

        {/* Mobile menu */}
        <div className="md:hidden ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-2">
                {NAV_ITEMS.map((i) => (
                  <SheetClose asChild key={i.to}>
                    <NavLink
                      to={i.to}
                      className={({ isActive }) =>
                        `${linkClasses} px-1 py-1 ${isActive ? "data-[active=true]" : ""}`
                      }
                      end
                    >
                      {i.label}
                    </NavLink>
                  </SheetClose>
                ))}

                <div className="h-px my-2 bg-border" />

                {user ? (
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                ) : (
                  <SheetClose asChild>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
