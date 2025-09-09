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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import logoUrl from "@/assets/learnd-logo.png";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "BarChart3" },
  { to: "/projects", label: "Projects", icon: "FolderOpen" },
  { to: "/insights", label: "Insights", icon: "Brain" },
  { to: "/reports", label: "Reports", icon: "FileText" },
];

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/auth");
    }
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
                `text-sm font-medium transition-colors relative ${
                  isActive 
                    ? "text-accent font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:rounded-full" 
                    : "text-muted-foreground hover:text-foreground"
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
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
