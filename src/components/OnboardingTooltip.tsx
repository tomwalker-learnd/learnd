import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  MousePointer,
  Eye
} from "lucide-react";

interface TooltipContent {
  title: string;
  description: string;
  ctaText?: string;
  skipText?: string;
  onCTA?: () => void;
  onSkip?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  type?: 'default' | 'success' | 'warning' | 'interactive';
  requireInteraction?: boolean;
}

interface OnboardingTooltipProps {
  target: Element;
  content: TooltipContent;
  position?: { x: number; y: number };
  className?: string;
}

export const OnboardingTooltip = ({
  target,
  content,
  position,
  className = ""
}: OnboardingTooltipProps) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!target || !tooltipRef.current) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };

    const spacing = 12;
    let bestPosition = { x: 0, y: 0 };
    let bestArrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    // Calculate different positioning options
    const positions = {
      bottom: {
        x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
        y: targetRect.bottom + spacing,
        arrow: 'top' as const
      },
      top: {
        x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
        y: targetRect.top - tooltipRect.height - spacing,
        arrow: 'bottom' as const
      },
      right: {
        x: targetRect.right + spacing,
        y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
        arrow: 'left' as const
      },
      left: {
        x: targetRect.left - tooltipRect.width - spacing,
        y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
        arrow: 'right' as const
      }
    };

    // Find best position based on viewport constraints
    const preferredPosition = content.position === 'auto' ? 'bottom' : content.position || 'bottom';
    let chosenPosition = positions[preferredPosition];

    // Check if preferred position fits in viewport
    const fitsInViewport = (pos: typeof chosenPosition) => {
      return pos.x >= 0 && 
             pos.x + tooltipRect.width <= viewport.width &&
             pos.y >= 0 && 
             pos.y + tooltipRect.height <= viewport.height;
    };

    if (!fitsInViewport(chosenPosition)) {
      // Try other positions
      const alternativeOrder: (keyof typeof positions)[] = ['bottom', 'top', 'right', 'left'];
      for (const pos of alternativeOrder) {
        if (fitsInViewport(positions[pos])) {
          chosenPosition = positions[pos];
          break;
        }
      }
    }

    // Adjust for viewport edges
    chosenPosition.x = Math.max(8, Math.min(chosenPosition.x, viewport.width - tooltipRect.width - 8));
    chosenPosition.y = Math.max(8, Math.min(chosenPosition.y, viewport.height - tooltipRect.height - 8));

    setTooltipPosition({
      x: chosenPosition.x + viewport.scrollX,
      y: chosenPosition.y + viewport.scrollY
    });
    setArrowPosition(chosenPosition.arrow);
  };

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 50);

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [target, content]);

  const getTypeStyles = () => {
    switch (content.type) {
      case 'success':
        return {
          border: 'border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/90',
          icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      case 'warning':
        return {
          border: 'border-amber-200 bg-amber-50/90 dark:bg-amber-950/90',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'interactive':
        return {
          border: 'border-primary/20 bg-primary/5 backdrop-blur-md',
          icon: <MousePointer className="h-5 w-5 text-primary" />,
          badge: 'bg-primary/10 text-primary border-primary/20'
        };
      default:
        return {
          border: 'border-border bg-background/90 backdrop-blur-md',
          icon: <Sparkles className="h-5 w-5 text-primary" />,
          badge: 'bg-secondary text-secondary-foreground'
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getArrowClasses = () => {
    const baseClasses = "absolute w-3 h-3 rotate-45 border";
    const borderClass = content.type === 'success' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950' :
                       content.type === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950' :
                       content.type === 'interactive' ? 'border-primary/20 bg-primary/5' :
                       'border-border bg-background';

    switch (arrowPosition) {
      case 'top':
        return `${baseClasses} ${borderClass} -top-1.5 left-1/2 transform -translate-x-1/2 border-b-0 border-r-0`;
      case 'bottom':
        return `${baseClasses} ${borderClass} -bottom-1.5 left-1/2 transform -translate-x-1/2 border-t-0 border-l-0`;
      case 'left':
        return `${baseClasses} ${borderClass} -left-1.5 top-1/2 transform -translate-y-1/2 border-t-0 border-r-0`;
      case 'right':
        return `${baseClasses} ${borderClass} -right-1.5 top-1/2 transform -translate-y-1/2 border-b-0 border-l-0`;
      default:
        return `${baseClasses} ${borderClass} -top-1.5 left-1/2 transform -translate-x-1/2 border-b-0 border-r-0`;
    }
  };

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[10000] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${className}`}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        maxWidth: '320px',
        minWidth: '280px'
      }}
    >
      <Card className={`shadow-xl border-2 ${typeStyles.border}`}>
        {/* Arrow */}
        <div className={getArrowClasses()} />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {typeStyles.icon}
              <CardTitle className="text-base font-semibold">
                {content.title}
              </CardTitle>
            </div>
            {content.type && (
              <Badge variant="outline" className={`text-xs ${typeStyles.badge}`}>
                {content.type === 'interactive' ? 'Try it' : 
                 content.type === 'success' ? 'Great!' : 
                 content.type === 'warning' ? 'Important' : 'Tip'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {content.description}
          </p>

          <div className="flex gap-2">
            {content.ctaText && (
              <Button
                onClick={content.onCTA}
                size="sm"
                className="flex-1"
                variant={content.type === 'interactive' ? 'default' : 'default'}
              >
                {content.type === 'interactive' && <Eye className="h-3 w-3 mr-1" />}
                {content.ctaText}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            
            {content.skipText && content.onSkip && (
              <Button
                onClick={content.onSkip}
                size="sm"
                variant="ghost"
                className="px-3"
              >
                {content.skipText}
              </Button>
            )}
          </div>

          {content.requireInteraction && (
            <div className="mt-3 p-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                Complete this action to continue
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};