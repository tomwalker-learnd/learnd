import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  message?: string;
}

export const CountdownTimer = ({ seconds, onComplete, message = "Auto-advancing in" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  return (
    <Badge variant="secondary" className="animate-pulse">
      <Clock className="h-3 w-3 mr-1" />
      {message} {timeLeft}s
    </Badge>
  );
};