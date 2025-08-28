// src/pages/Dashboard.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp } from "lucide-react";

type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string;
  satisfaction: number | null;
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
  created_by: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedOnce = useRef(false);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("lessons")
        .select(
          [
            "id",
            "project_name",
            "created_at",
            "satisfaction",
            "budget_status",
            "timeline_status",
            "created_by",
          ].join(", ")
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRows((data as unknown as LessonRow[]) ?? []);
    } catch (e: any) {
      console.warn("[Dashboard] fetchData error:", e?.message || e);
      setError(e?.message ?? "Failed to load data.");
      setRows([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && !fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchData();
    }
  }, [authLoading, user]);

  const onRefresh = () => {
    fetchedOnce.current = true;
    fetchData();
  };

  // KPIs on full dataset
  const { totalLessons, avgSatisfaction } = useMemo(() => {
    const data = rows ?? [];
    const totalLessons = data.length;

    const sats = data
      .map((r) => (typeof r.satisfaction === "number" ? r.satisfaction : null))
      .filter((x): x is number => x !== null);
    const avgSatisfaction = sats.length
      ? +(sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(2)
      : null;

    return { totalLessons, avgSatisfaction };
  }, [rows]);

  const kpiValue = (v: number | null) => (v === null ? "—" : v);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard"
        description="Overview of project lessons."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {/* Gradient Analytics button */}
            <Button
              size="sm"
              onClick={() => navigate("/analytics")}
              className={[
                "relative overflow-hidden",
                "text-white shadow-sm",
                "transition-opacity",
                "hover:opacity-95 active:opacity-90",
                "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400",
                "[background-size:200%_200%] animate-[gradientShift_6s_ease_infinite]",
                "border border-transparent",
              ].join(" ")}
              aria-label="Open Analytics"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">
                {kpiValue(totalLessons)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Avg. Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">
                {kpiValue(avgSatisfaction ?? null)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
