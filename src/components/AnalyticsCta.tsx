// src/components/AnalyticsCta.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

type Props = {
  to?: string;                          // default /analytics
  label?: string;                       // default "Analytics"
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;                 // optional telemetry hook
  disabled?: boolean;
};

export default function AnalyticsCta({
  to = "/analytics",
  label = "Analytics",
  size = "default",
  className,
  onClick,
  disabled,
}: Props) {
  return (
    <Button
      asChild
      variant="analytics"                // <-- dark teal color (#0d3240)
      size={size}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      <Link to={to} aria-label={label}>
        <TrendingUp className="h-4 w-4 mr-2" />
        {label}
      </Link>
    </Button>
  );
}
