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
        description="Browse the default dashboard and tailor custom dashboards for your team."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/dashboards/customize")}>
              Customize
            </Button>
            <Button variant="outline" onClick={() => navigate("/analytics")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        }
      />

      {/* Default / Library card(s) */}
      <Card>
        <CardHeader>
          <CardTitle>Default Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Start with the default view and refine from there.
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Open
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lower Pane: Customization CTA / area */}
      <Card>
        <CardHeader>
          <CardTitle>Customize</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Create and manage custom dashboards for specific roles, teams, or clients.
            </div>
            <Button onClick={() => navigate("/dashboards/customize")}>
              Customize Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lower Pane: (Optional) Saved custom dashboards list */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Dashboards</CardTitle>
        </CardHeader>
        <CardContent>
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
