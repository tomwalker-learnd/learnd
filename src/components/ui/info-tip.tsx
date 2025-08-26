// src/components/ui/info-tip.tsx
"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type InfoTipProps = {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
};

/**
 * Hardened InfoTip
 * - Hooks are only called at the top level (never conditionally).
 * - No conditional TooltipProvider mounting (use one global provider or this local one always).
 * - Touch detection uses both navigator.maxTouchPoints and (pointer: coarse).
 */
export function InfoTip({
  children,
  side = "top",
  align = "center",
  className = "",
}: InfoTipProps) {
  // top-level hooks only:
  const [isTouch, setIsTouch] = React.useState<boolean>(() => {
    // Initial best-effort guess without accessing window in SSR
    if (typeof navigator !== "undefined" && typeof navigator.maxTouchPoints === "number") {
      return navigator.maxTouchPoints > 0;
    }
    return false;
  });

  React.useEffect(() => {
    // Guard if window or matchMedia is unavailable
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => {
      const hasTouchPoints =
        typeof navigator !== "undefined" && typeof navigator.maxTouchPoints === "number"
          ? navigator.maxTouchPoints > 0
          : false;
      setIsTouch(Boolean(mq.matches || hasTouchPoints));
    };

    update(); // set immediately
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } else if ((mq as any).addListener) {
      // older Safari fallback
      (mq as any).addListener(update);
      return () => (mq as any).removeListener(update);
    }
  }, []);

  // Always render within a TooltipProvider so provider-mount isn’t conditional.
  // (If you already wrap your app with TooltipProvider, keeping this here is still safe.)
  return (
    <TooltipProvider delayDuration={150}>
      {isTouch ? (
        // Touch devices: click/tap to open
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Help"
              className={className}
            >
              <Info className="h-4 w-4 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side={side}
            align={align}
            className="max-w-xs text-sm leading-snug"
          >
            {children}
          </PopoverContent>
        </Popover>
      ) : (
        // Pointers (mouse/trackpad): hover/focus tooltip
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Help"
              className={"inline-flex items-center justify-center " + className}
            >
              <Info className="h-4 w-4 opacity-70" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            className="max-w-sm text-sm leading-snug"
          >
            {children}
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}
