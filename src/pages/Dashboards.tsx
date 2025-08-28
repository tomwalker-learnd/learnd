// src/pages/Dashboards.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

type Preset = {
  id: string;
  name: string;
  description: string;
  // Params you can later apply inside DashboardCustomizer (or Analytics) to prefill filters
  params: {
    timeRangeDays?: number;
    budget_status?: "under" | "on" | "over";
    timeline_status?: "early" | "on" | "late";
    min_satisfaction?: number;
    max_satisfaction?: number;
    min_change_requests?: number;
    min_change_revenue_usd?: number;
  };
};

const PRESET_DASHBOARDS: Preset[] = [
  {
    id: "overall_health",
    name: "Overall Delivery Health",
    description: "All lessons from the last 90 days to assess satisfaction, budget, and timeline health.",
    params: { timeRangeDays: 90 },
  },
  {
    id: "budget_risk",
    name: "Budget at Risk",
    description: "Lessons marked Over budget in the last 90 days.",
    params: { timeRangeDays: 90, budget_status: "over" },
  },
  {
    id: "timeline_risk",
    name: "Timeline at Risk",
    description: "Lessons marked Late in the last 90 days.",
    params: { timeRangeDays: 90, timeline_status: "late" },
  },
  {
    id: "low_satisfaction",
    name: "Low Satisfaction",
    description: "Satisfaction ≤ 2 over the last 60 days.",
    params: { timeRangeDays: 60, max_satisfaction: 2 },
  },
  {
    id: "change_orders_impact",
    name: "Change Orders Impact",
    description: "Lessons with non-zero change order revenue in the last 180 days.",
    params: { timeRangeDays: 180, min_change_revenue_usd: 1 },
  },
  {
    id: "high_change_requests",
    name: "High Change Requests",
    description: "Lessons with 3+ change requests in the last 90 days.",
    params: { timeRangeDays: 90, min_change_requests: 3 },
  },
];

type CustomDashboard = { id: string; name: string };

export default function Dashboards() {
  const navigate = useNavigate();

  // TODO: replace with real data when custom dashboards are persisted
  const customDashboards: CustomDashboard[] = [];

  const presets = useMemo(() => PRESET_DASHBOARDS, []);

  const openPreset = (id: string) => {
    // Pass just the id for now; the customizer can map id->params
    navigate(`/dashboards/customize?preset=${encodeURIComponent(id)}`);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboards"
        description="Pick a suggested dashboard or create your own."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/dashboards/customize")}>
              Create dashboard
            </Button>
          </div>
        }
      />

      {/* Top Pane: Suggested (Canned) Dashboards */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Dashboards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {presets.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 flex items-start justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => openPreset(p.id)}>Open</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lower Pane: Custom Dashboards */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Dashboards</CardTitle>
        </CardHeader>
        <CardContent>
          {customDashboards.length === 0 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">No custom dashboards yet.</div>
              <Button onClick={() => navigate("/dashboards/customize")}>
                Create dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customDashboards.map((d) => (
                <div key={d.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="font-medium">{d.name}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboards/customize?id=${encodeURIComponent(d.id)}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboards/customize?id=${encodeURIComponent(d.id)}`)}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button variant="outline" onClick={() => navigate("/dashboards/customize")}>
                  New dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
