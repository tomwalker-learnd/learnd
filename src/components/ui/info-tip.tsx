// components/ui/info-tip.tsx
'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function InfoTip({
  children,
  side = 'top',
  align = 'center',
  className = '',
}: {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    // Detect coarse (touch) pointer
    const mq = window.matchMedia?.('(pointer: coarse)');
    setIsTouch(!!mq?.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq?.addEventListener?.('change', handler);
    return () => mq?.removeEventListener?.('change', handler);
  }, []);

  if (isTouch) {
    // On touch devices: tap to open
    return (
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
    );
  }

  // On desktop: hover/focus tooltip
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Help"
            className={
              'inline-flex items-center justify-center ' + className
            }
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
    </TooltipProvider>
  );
}
