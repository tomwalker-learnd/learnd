// src/pages/Lessons.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { RefreshCw } from "lucide-react";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  created_at: string; // ISO
  satisfaction: number | null; // 1..5
  budget_status: BudgetStatus | string | null;
  timeline_status: TimelineStatus | string | null;
};

type LessonFilters = {
  search: string;
  budget: BudgetStatus | "any";
  timeline: TimelineStatus | "any";
  minSatisfaction: string; // UI field
};

type DateWindow = { from?: string; to?: string } | null;

const DEFAULT_FILTERS: LessonFilters = {
  search: "",
  budget: "any",
  timeline: "any",
  minSatisfaction: "",
};

const SELECT_FIELDS = [
  "id",
  "project_name",
  "client_name",
  "created_at",
  "satisfaction",
  "budget_status",
  "timeline_status",
].join(", ");

// helpers
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

  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LessonFilters>(DEFAULT_FILTERS);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const [dateWindow, setDateWindow] = useState<DateWindow>(null);
  const appliedFromUrlOnce = useRef(false);

  // Parse incoming params from Dashboards/custom dashboards
  const incoming = useMemo(() => {
    const get = (k: string) => (searchParams.get(k) ?? "").trim();
    return {
      from: get("from"),
      to: get("to"),
      q: get("q"),
      b: get("b"), // under|on|over
      t: get("t"), // early|on|late
      min: get("min"), // number as string
      apply: get("apply") === "1",
    };
  }, [searchParams]);

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
        console.error("Lessons load failed:", e);
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

  // Prefill from URL; only APPLY the date window when apply=1
  useEffect(() => {
    const hasAny =
      incoming.from || incoming.to || incoming.q || incoming.b || incoming.t || incoming.min;

    if (!hasAny) return;

    // Prefill controls
    setFilters((prev) => ({
      ...prev,
      search: incoming.q || "",
      budget: (incoming.b as any) || "any",
      timeline: (incoming.t as any) || "any",
      minSatisfaction: incoming.min || "",
    }));

    if (incoming.apply && !appliedFromUrlOnce.current) {
      setDateWindow({
        from: incoming.from || undefined,
        to: incoming.to || undefined,
      });
      appliedFromUrlOnce.current = true;
    }
  }, [incoming]);

  // Is the user actively filtering?
  const hasUiFilters = useMemo(() => {
    return (
      filters.search.trim() !== "" ||
      filters.budget !== "any" ||
      filters.timeline !== "any" ||
      filters.minSatisfaction.trim() !== ""
    );
  }, [filters]);

  // Show ALL rows by default; only narrow when UI filters are used,
  // or when a dateWindow was explicitly applied via apply=1.
  const filtered = useMemo(() => {
    if (!rows) return [];

    const useDateWindow = !!(dateWindow && (dateWindow.from || dateWindow.to));
    if (!hasUiFilters && !useDateWindow) return rows;

    const s = filters.search.trim().toLowerCase();
    const uiMinSat =
      filters.minSatisfaction.trim() === "" ? null : Number(filters.minSatisfaction);
    const useUiMinSat = Number.isFinite(uiMinSat as number) ? (uiMinSat as number) : null;

    const fromT = useDateWindow && dateWindow?.from ? new Date(dateWindow.from).getTime() : null;
    const toT = useDateWindow && dateWindow?.to ? new Date(dateWindow.to).getTime() : null;

    return rows.filter((r) => {
      // Date window from dashboards (only if applied)
      if (useDateWindow) {
        const t = new Date(r.created_at).getTime();
        if (fromT && t < fromT) return false;
        if (toT && t > toT) return false;
      }

      // text search
      if (s) {
        const hay = `${r.project_name ?? ""} ${r.client_name ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }

      // budget
      if (filters.budget !== "any") {
        const b = normBudget(r.budget_status);
        if (b !== filters.budget) return false;
      }

      // timeline
      if (filters.timeline !== "any") {
        const tl = normTimeline(r.timeline_status);
        if (tl !== filters.timeline) return false;
      }

      // min satisfaction
      if (useUiMinSat !== null) {
        if (typeof r.satisfaction !== "number" || r.satisfaction < useUiMinSat) return false;
      }

      return true;
    });
  }, [rows, filters, dateWindow, hasUiFilters]);

  // Pagination
  useEffect(() => {
    setPage(1);
  }, [filters, pageSize, dateWindow]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageRows = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  const onRefresh = () => setFilters({ ...filters });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>Filter, browse, and analyze recent lessons.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {dateWindow && (dateWindow.from || dateWindow.to) ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    From dashboard:{" "}
                    {dateWindow.from ? new Date(dateWindow.from).toLocaleDateString() : "…"}
                    {" – "}
                    {dateWindow.to ? new Date(dateWindow.to).toLocaleDateString() : "…"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setDateWindow(null)}>
                    Clear
                  </Button>
                </div>
              ) : null}
              <Button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setDateWindow(null);
                }}
                style={{ backgroundColor: '#0d3240', color: 'white' }}
                className="hover:opacity-90"
              >
                Clear Filters
              </Button>
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
                placeholder="Project or client…"
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
                onChange={(e) => setFilters((prev) => ({ ...prev, minSatisfaction: e.target.value }))}
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
              {rows === null ? "Loading…" : `${total} of ${rows.length} shown`}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={safePage <= 1}
                aria-label="First page"
                title="First page"
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Prev
              </Button>
              <div className="px-2 text-sm text-muted-foreground">
                Page {safePage} of {pageCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pageCount)}
                disabled={safePage >= pageCount}
                aria-label="Last page"
                title="Last page"
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
