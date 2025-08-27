// src/pages/Dashboards.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TrendingUp } from "lucide-react";

export default function Dashboards() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboards"
        description="View the default dashboard or build a custom one for your team."
      />

      {/* Top: Default Dashboard (keep it simple here, or embed your current quick KPIs) */}
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2 sm:flex-row">
          <div>
            <CardTitle className="text-xl">Default Dashboard</CardTitle>
            <p className="text-sm text-muted-foreground">
              A quick, read-only snapshot for everyone.
            </p>
          </div>
          <TrendingUp className="h-5 w-5 opacity-70" />
        </CardHeader>
        <CardContent>
          {/* Replace this section with your preferred default widgets/charts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <div className="text-sm text-muted-foreground">Open Projects</div>
              <div className="text-2xl font-semibold">—</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-sm text-muted-foreground">Avg. Satisfaction</div>
              <div className="text-2xl font-semibold">—</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-sm text-muted-foreground">On-Budget Rate</div>
              <div className="text-2xl font-semibold">—</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Tip: swap these for your existing KPI components or embed a compact chart.
          </div>
        </CardContent>
      </Card>

      {/* Bottom: Custom Dashboards Pane */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Custom Dashboards</CardTitle>
          <p className="text-sm text-muted-foreground">
            Build tailored views for roles, clients, or execs. Your saved custom dashboards will appear here.
          </p>
        </CardHeader>
        <CardContent>
          {/* When you add persistence, list saved dashboards here. */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              No custom dashboards yet.
            </div>
            <Button onClick={() => navigate("/dashboards/customize")}>
              Create Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
