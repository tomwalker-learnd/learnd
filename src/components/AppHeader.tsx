// src/components/AppHeader.tsx
import { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// SINGLE SOURCE OF TRUTH for both desktop and mobile nav
const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/dashboards", label: "Dashboards" },
  { to: "/lessons", label: "Lessons" },
  { to: "/analytics", label: "Analytics" },
];

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initial = useMemo(() => {
    const src = (user?.user_metadata?.full_name as string) || user?.email || "U";
    return src.trim()[0]?.toUpperCase() ?? "U";
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const linkClass =
    "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground";
  const activeClass = ({ isActive }: { isActive: boolean }) =>
    `${linkClass} ${isActive ? "text-foreground" : ""}`;

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          {/* Swap for your logo image if desired */}
          <span className="text-xl font-extrabold tracking-tight">Learnd</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={activeClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Desktop profile dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  aria-label="Open profile menu"
                >
                  <span className="text-sm font-semibold">{initial}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {NAV_ITEMS.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={handleSignOut}>
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger / sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80">
              <SheetHeader className="mb-2">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <NavLink to={item.to} className={activeClass}>
                      {item.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </div>

              <div className="mt-4 border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
