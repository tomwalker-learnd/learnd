// src/components/AppHeader.tsx
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
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
import logoUrl from "@/assets/learnd-logo.png";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/dashboards", label: "Dashboards" },
  { to: "/lessons", label: "Lessons" },
  { to: "/analytics", label: "Analytics" },
];

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
        {/* Left: Logo + tagline */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Learnd logo" className="h-8 w-auto" />
        </Link>

        {/* Center: desktop nav */}
        <nav className="hidden flex-1 justify-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: hamburger (mobile) + user menu */}
        <div className="ml-auto flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <NavLink to={item.to} className="text-lg font-medium">
                      {item.label}
                    </NavLink>
                  </SheetClose>
                ))}
                {user && (
                  <Button variant="ghost" onClick={handleSignOut} className="justify-start text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:inline-flex gap-2">
                  <User className="h-4 w-4" />
                  {user.email?.[0]?.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
