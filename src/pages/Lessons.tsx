// src/pages/Lessons.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  created_at: string;
  satisfaction: number | null; // 1..5
  budget_status: BudgetStatus | string | null;   // widen to string for normalization
  timeline_status: TimelineStatus | string | null; // widen to string for normalization
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

type LessonFilters = {
  search: string;
  budget: BudgetStatus | "any";
  timeline: TimelineStatus | "any";
  minSatisfaction: string; // UI field
};

const DEFAULT_FILTERS: LessonFilters = {
  search: "",
  budget: "any",
  timeline: "any",
  minSatisfaction: "",
};

// columns list (no inline comments)
const SELECT_FIELDS = [
  "id",
  "project_name",
  "client_name",
  "created_at",
  "satisfaction",
  "budget_status",
  "timeline_status",
  "change_request_count",
  "change_orders_approved_count",
  "change_orders_revenue_usd",
  "created_by",
].join(", ");

// --- helpers ---
const normStr = (v: unknown) =>
  (typeof v === "string" ? v : v == null ? "" : String(v)).trim();

const normBudget = (v: unknown): BudgetStatus | null => {
  const s = normStr(v).toLowerCase();
  return s === "under" || s === "on" || s === "over" ? (s as BudgetStatus) : null;
};

const normTimeline = (v: unknown): TimelineStatus | null => {
  const s = normStr(v).toLowerCase();
  return s === "early" || s === "on" || s === "late" ? (s as TimelineStatus) : null;
};

export default function Lessons() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Parse URL params for deep-links from Dashboards
  const urlParams = useMemo(() => {
    const norm = (v: string | null) => (v ?? "").trim();
    const num = (v: string | null) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const budgetIn = norm(searchParams.get("budget")).toLowerCase();
    const timelineIn = norm(searchParams.get("timeline")).toLowerCase();

    const budget = budgetIn === "under" || budgetIn === "on" || budgetIn === "over" ? (budgetIn as BudgetStatus) : null;
    const timeline = timelineIn === "early" || timelineIn === "on" || timelineIn === "late" ? (timelineIn as TimelineStatus) : null;

    return {
      budget,
      timeline,
      minSat: num(searchParams.get("minSat")),
      maxSat: num(searchParams.get("maxSat")),
      periodDays: num(searchParams.get("periodDays")),
      minChangeReqs: num(searchParams.get("minChangeReqs")),
      minChangeRevenue: num(searchParams.get("minChangeRevenue")),
    };
  }, [searchParams]);

  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LessonFilters>(DEFAULT_FILTERS);

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("lessons")
          .select(SELECT_FIELDS)
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        if (!cancelled) setRows((data as unknown as LessonRow[]) ?? []);
      } catch (e: any) {
        toast({
          title: "Load failed",
          description: e?.message ?? "Unable to load lessons.",
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

  // Apply both UI filters and URL-derived filters (AND logic)
  const filtered = useMemo(() => {
    if (!rows) return [];

    const s = filters.search.trim().toLowerCase();
    const uiMinSat =
      filters.minSatisfaction.trim() === "" ? null : Number(filters.minSatisfaction);
    const useUiMinSat = Number.isFinite(uiMinSat as number) ? (uiMinSat as number) : null;

    const sinceMs =
      urlParams.periodDays && urlParams.periodDays > 0
        ? Date.now() - urlParams.periodDays * 24 * 60 * 60 * 1000
        : null;

    return rows.filter((r) => {
      const rBudget = normBudget(r.budget_status);
      const rTimeline = normTimeline(r.timeline_status);

      // text search
      if (s) {
        const hay = `${r.project_name ?? ""} ${r.client_name ?? ""} ${rBudget ?? ""} ${rTimeline ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }

      // budget (UI first, else URL) — compare on normalized values
      if (filters.budget !== "any") {
        if (rBudget !== filters.budget) return false;
      } else if (urlParams.budget) {
        if (rBudget !== urlParams.budget) return false;
      }

      // timeline (UI first, else URL)
      if (filters.timeline !== "any") {
        if (rTimeline !== filters.timeline) return false;
      } else if (urlParams.timeline) {
        if (rTimeline !== urlParams.timeline) return false;
      }

      // satisfaction thresholds
      if (useUiMinSat !== null) {
        if (typeof r.satisfaction !== "number" || r.satisfaction < useUiMinSat) return false;
      }
      if (urlParams.minSat !== null) {
        if (typeof r.satisfaction !== "number" || r.satisfaction < urlParams.minSat) return false;
      }
      if (urlParams.maxSat !== null) {
        if (typeof r.satisfaction !== "number" || r.satisfaction > urlParams.maxSat) return false;
      }

      // change request / revenue thresholds
      if (urlParams.minChangeReqs !== null) {
        const v = typeof r.change_request_count === "number" ? r.change_request_count : -Infinity;
        if (v < urlParams.minChangeReqs) return false;
      }
      if (urlParams.minChangeRevenue !== null) {
        const v = typeof r.change_orders_revenue_usd === "number" ? r.change_orders_revenue_usd : -Infinity;
        if (v < urlParams.minChangeRevenue) return false;
      }

      // period window
      if (sinceMs !== null) {
        const t = new Date(r.created_at).getTime();
        if (!(t >= sinceMs)) return false;
      }

      return true;
    });
  }, [rows, filters, urlParams]);

  // Reset to page 1 when filters, page size, or URL params change
  useEffect(() => {
    setPage(1);
  }, [filters, pageSize, urlParams]);

  // Client-side pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageRows = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  const onRefresh = () => setFilters({ ...filters });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>Filter, browse, and analyze recent lessons.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters (UI) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Project, client, budget, timeline..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Budget</Label>
              <Select
                value={filters.budget}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    budget: (normStr(v).toLowerCase() as LessonFilters["budget"]) || "any",
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
              <Label>Timeline</Label>
              <Select
                value={filters.timeline}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    timeline: (normStr(v).toLowerCase() as LessonFilters["timeline"]) || "any",
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
                min={1}
                max={5}
                step={1}
                inputMode="numeric"
                placeholder="1–5 (e.g., 4)"
                value={filters.minSatisfaction}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minSatisfaction: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Results</CardTitle>
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : total === 0 ? "No results" : `${total} record${total === 1 ? "" : "s"}`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead className="text-right">Change Reqs</TableHead>
                  <TableHead className="text-right">Change Orders Approved</TableHead>
                  <TableHead className="text-right">Change Orders Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{r.project_name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.client_name ?? "—"}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{typeof r.satisfaction === "number" ? r.satisfaction : "—"}</TableCell>
                    <TableCell className="capitalize">{normBudget(r.budget_status) ?? "—"}</TableCell>
                    <TableCell className="capitalize">{normTimeline(r.timeline_status) ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {typeof r.change_request_count === "number" ? r.change_request_count : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {typeof r.change_orders_approved_count === "number" ? r.change_orders_approved_count : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {typeof r.change_orders_revenue_usd === "number" ? `$${r.change_orders_revenue_usd.toLocaleString()}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Rows per page</Label>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">
                {total === 0 ? "0 of 0" : `${startIndex + 1}–${endIndex} of ${total}`}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage <= 1} aria-label="First page" title="First page">
                «
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
                Prev
              </Button>
              <div className="px-2 text-sm text-muted-foreground">Page {safePage} of {pageCount}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}>
                Next
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(pageCount)} disabled={safePage >= pageCount} aria-label="Last page" title="Last page">
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
