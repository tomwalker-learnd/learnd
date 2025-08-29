// src/components/AppHeader.tsx
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

// Restore Analytics to the nav
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
          <img
            src="/assets/learnd-logo.png"
            alt="Learnd logo"
            className="h-8 w-auto"
          />
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
            Learn. Improve. Repeat.
          </span>
        </Link>

        {/* Center: desktop nav (kept centered) */}
        <nav className="hidden flex-1 justify-center gap-6 md:flex">
