// src/pages/DashboardCustomizer.tsx
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { useAuth } from "@/hooks/useAuth"; // Optional: enforce admin-only access

export default function DashboardCustomizer() {
  const navigate = useNavigate();
  // const { user } = useAuth();
  // const isAdmin = user?.app_metadata?.role === "admin";
  // if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Custom Dashboard Builder"
        description="Drag, drop, and configure your widgets. Save to make it available under Dashboards → Custom."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboards")}>
              Back to Dashboards
            </Button>
            <Button onClick={() => {/* TODO: wire up save */}}>
              Save Dashboard
            </Button>
          </div>
        }
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Layout & Widgets</CardTitle>
        </CardHeader>
        <CardContent>
          {/* === Paste your drag-and-drop mockup/builder here ===
              For now, put a placeholder so the page renders cleanly. */}
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            Builder placeholder — drop in the DnD code we mocked up. Configure
            data sources, filters, and chart types here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
