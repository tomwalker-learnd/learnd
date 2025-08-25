import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page header (no logo here; AppHeader handles branding) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome{user?.email ? `, ${user.email}` : ""}. Quick snapshot of your lessons and analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/submit">Capture New Lesson</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/analytics">View Analytics</Link>
          </Button>
        </div>
      </div>

      {/* Example content grid — replace with your real widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your latest submitted lessons will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aggregate satisfaction, timeline, and budget signals.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Control</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Requests, approvals, and revenue from change orders.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
