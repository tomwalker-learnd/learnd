import { CheckCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./CountdownTimer";

interface OnboardingSuccessToastProps {
  title: string;
  description: string;
  showCountdown?: boolean;
  countdownSeconds?: number;
  onCountdownComplete?: () => void;
}

export const OnboardingSuccessToast = ({
  title,
  description,
  showCountdown = false,
  countdownSeconds = 3,
  onCountdownComplete
}: OnboardingSuccessToastProps) => {
  return (
    <Card className="fixed top-4 right-4 z-[10001] shadow-xl border-emerald-200 bg-emerald-50/90 backdrop-blur-sm max-w-sm animate-slide-in-right">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-emerald-900">{title}</h4>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Success!
              </Badge>
            </div>
            <p className="text-sm text-emerald-700 leading-relaxed">
              {description}
            </p>
            {showCountdown && onCountdownComplete && (
              <div className="mt-3">
                <CountdownTimer
                  seconds={countdownSeconds}
                  onComplete={onCountdownComplete}
                  message="Next page in"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};