import { Link, NavLink } from "react-router-dom";

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="h-12 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/dashboard" className="inline-flex items-center gap-2">
            <img
              src="/brand/learnd-logo-v8_Lgt.png"
              alt="Learnd"
              className="h-6 w-auto"
            />
            {/* If you want a tiny wordmark next to the icon later, add it here */}
          </Link>

          {/* Right: (optional) quick links — easy to enable later */}
          <nav className="hidden sm:flex items-center gap-5 text-sm">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`
              }
            >
              Dashboard
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
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
