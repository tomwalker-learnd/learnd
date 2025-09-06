import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { OnboardingTooltip } from "./OnboardingTooltip";

interface SpotlightTarget {
  element: Element;
  padding?: number;
}

interface TooltipContent {
  title: string;
  description: string;
  ctaText?: string;
  skipText?: string;
  onCTA?: () => void;
  onSkip?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  type?: 'default' | 'success' | 'warning' | 'interactive';
}

interface OnboardingOverlayProps {
  isVisible: boolean;
  target?: SpotlightTarget | null;
  tooltip?: TooltipContent | null;
  onClose?: () => void;
  className?: string;
}

export const OnboardingOverlay = ({
  isVisible,
  target = null,
  tooltip = null,
  onClose,
  className = ""
}: OnboardingOverlayProps) => {
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const updateSpotlight = useCallback(() => {
    if (!target?.element) {
      setSpotlightStyle({});
      return;
    }

    const rect = target.element.getBoundingClientRect();
    const padding = target.padding || 8;
    
    // Create spotlight effect using box-shadow
    const spotlightX = rect.left + rect.width / 2;
    const spotlightY = rect.top + rect.height / 2;
    const spotlightWidth = rect.width + padding * 2;
    const spotlightHeight = rect.height + padding * 2;
    
    // Create a cutout effect using clip-path or box-shadow
    const style: React.CSSProperties = {
      clipPath: `polygon(
        0% 0%, 
        0% 100%, 
        ${rect.left - padding}px 100%, 
        ${rect.left - padding}px ${rect.top - padding}px, 
        ${rect.right + padding}px ${rect.top - padding}px, 
        ${rect.right + padding}px ${rect.bottom + padding}px, 
        ${rect.left - padding}px ${rect.bottom + padding}px, 
        ${rect.left - padding}px 100%, 
        100% 100%, 
        100% 0%
      )`,
    };

    setSpotlightStyle(style);

    // Calculate tooltip position
    if (tooltip) {
      const tooltipX = rect.left + rect.width / 2;
      const tooltipY = rect.bottom + padding + 10; // Default to bottom
      setTooltipPosition({ x: tooltipX, y: tooltipY });
    }
  }, [target, tooltip]);

  useEffect(() => {
    if (isVisible && target) {
      updateSpotlight();
      
      // Update on scroll and resize
      const updateHandler = () => updateSpotlight();
      window.addEventListener('scroll', updateHandler, true);
      window.addEventListener('resize', updateHandler);
      
      return () => {
        window.removeEventListener('scroll', updateHandler, true);
        window.removeEventListener('resize', updateHandler);
      };
    }
  }, [isVisible, target, updateSpotlight]);

  if (!isVisible) return null;

  const overlayContent = (
    <>
      {/* Main overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 z-[9998] ${className}`}
        style={spotlightStyle}
        onClick={(e) => {
          // Only close if clicking on the backdrop, not the spotlighted area
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      />
      
      {/* Spotlight glow effect */}
      {target?.element && (
        <div
          className="fixed pointer-events-none z-[9999] transition-all duration-300 animate-pulse"
          style={{
            left: target.element.getBoundingClientRect().left - (target.padding || 8),
            top: target.element.getBoundingClientRect().top - (target.padding || 8),
            width: target.element.getBoundingClientRect().width + (target.padding || 8) * 2,
            height: target.element.getBoundingClientRect().height + (target.padding || 8) * 2,
            boxShadow: `
              0 0 0 4px rgba(255, 255, 255, 0.1),
              0 0 0 8px rgba(255, 255, 255, 0.05),
              0 0 20px 12px rgba(255, 255, 255, 0.1),
              inset 0 0 0 2px rgba(255, 255, 255, 0.2)
            `,
            borderRadius: '8px'
          }}
        />
      )}

      {/* Tooltip */}
      {tooltip && target?.element && (
        <OnboardingTooltip
          target={target.element}
          content={tooltip}
          position={tooltipPosition}
          className="z-[10000]"
        />
      )}
    </>
  );

  return createPortal(overlayContent, document.body);
};

// Helper function to find element by selector
export const findElementBySelector = (selector: string): Element | null => {
  return document.querySelector(selector);
};

// Helper function to wait for element to appear
export const waitForElement = (
  selector: string, 
  timeout: number = 5000
): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};