import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Helpers to ensure charts render when container gains real size */
const hasPositiveArea = (el: HTMLElement | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/** Simple viewport hook */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  return isMobile;
};

export default function Analytics() {
  const isMobile = useIsMobile();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="text-sm text-muted-foreground">
          View: {isMobile ? "Mobile" : "Desktop"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder analytics tile. Wire your charts here.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trends</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder analytics tile.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Outliers</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder analytics tile.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
