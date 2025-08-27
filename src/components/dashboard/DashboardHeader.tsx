import { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * Lightweight page subheader shown **below** the global AppHeader.
 * No auth/brand/user UI here — that's AppHeader's job.
 */
export function DashboardHeader({ title, description, actions }: Props) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-12 z-30">
      {/* top-12 assumes AppHeader height ~48px; adjust if needed */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
