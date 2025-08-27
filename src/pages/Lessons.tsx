// src/pages/Lessons.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Filter, RefreshCw } from "lucide-react";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name?: string | null;
  created_at: string;
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

type LessonFilters = {
  search: string;
  budget: BudgetStatus | "any";
  timeline: TimelineStatus | "any";
  minSatisfaction: string;
};

const DEFAULT_FILTERS: LessonFilters = {
  search: "",
  budget: "any",
  timeline: "any",
  minSatisfaction: "",
};

const Lessons = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<LessonFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("lessons")
          .select(
            `
            id,
            project_name,
            client_name,
            created_at,
            satisfaction,
            budget_status,
            timeline_status,
            change_request_count,
            change_orders_approved_count,
            change_orders_revenue_usd,
            created_by
          `
          )
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;
        if (!cancelled) setRows((data as unknown as LessonRow[]) ?? []);
      } catch (e: any) {
        toast({
          title: "Load failed",
          description: e?.message ?? "Could not load lessons.",
          variant: "destructive",
        });
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = filters.search.trim().toLowerCase();
    const minSat = filters.minSatisfaction ? Number(filters.minSatisfaction) : null;

    return rows.filter((r) => {
      const matchesSearch =
        s.length === 0 ||
        (r.project_name ?? "").toLowerCase().includes(s) ||
        (r.client_name ?? "").toLowerCase().includes(s);

      const matchesBudget =
        filters.budget === "any" || r.budget_status === filters.budget;

      const matchesTimeline =
        filters.timeline === "any" || r.timeline_status === filters.timeline;

      const satVal = typeof r.satisfaction === "number" ? r.satisfaction : null;
      const matchesSatisfaction =
        minSat === null || (satVal !== null && satVal >= minSat);

      return (
        matchesSearch &&
        matchesBudget &&
        matchesTimeline &&
        matchesSatisfaction
      );
    });
  }, [rows, filters]);

  if (!loading && !user) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-6">
      {/* Page Heading (replaces DashboardHeader) */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Lessons</h1>
        <p className="text-muted-foreground">
          Browse and filter your submitted lessons.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? "Hide Filters" : "View Filters"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setFilters(DEFAULT_FILTERS)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Refine results without leaving the page.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Project or Client"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value ?? "" }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Budget Status</Label>
              <Select
                value={filters.budget}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    budget: (v as LessonFilters["budget"]) ?? "any",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="under">Under</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="over">Over</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeline Status</Label>
              <Select
                value={filters.timeline}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    timeline: (v as LessonFilters["timeline"]) ?? "any",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSat">Min Satisfaction</Label>
              <Input
                id="minSat"
                type="number"
                min={0}
                max={10}
                inputMode="numeric"
                placeholder="e.g. 7"
                value={filters.minSatisfaction}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minSatisfaction: e.target.value ?? "",
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {isLoading ? "Loading…" : `${filtered.length} item(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>CRs</TableHead>
                  <TableHead>CO Rev</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.project_name ?? "—"}
                    </TableCell>
                    <TableCell>{r.client_name ?? "—"}</TableCell>
                    <TableCell>
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {typeof r.satisfaction === "number"
                        ? r.satisfaction
                        : "—"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {r.budget_status ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {r.timeline_status ?? "—"}
                    </TableCell>
                    <TableCell>{r.change_request_count ?? 0}</TableCell>
                    <TableCell>
                      {typeof r.change_orders_revenue_usd === "number"
                        ? `$${r.change_orders_revenue_usd.toLocaleString()}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lessons;
