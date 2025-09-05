// src/pages/Analytics.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ---------- Brand colors (adjust to your palette) ----------
const COLORS = {
  purple: "#7c3aed",         // Avg Satisfaction
  green:  "#16a34a",         // Budget Under / Timeline Early
  blue:   "#2563eb",         // Budget On / Timeline On
  red:    "#ef4444",         // Budget Over / Timeline Late
  gold:   "#f59e0b",         // On-Budget % line
  teal:   "#0ea5a4",         // Change Orders Revenue
};

// ---------- Types ----------
type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string; // ISO
  satisfaction: number | null;
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

// ---------- Metric registry ----------
type MetricKey =
  | "avgSatisfaction"
  | "budgetStatus"
  | "timelineStatus"
  | "onBudgetRate"
  | "changeOrdersRevenue";

const METRIC_LABELS: Record<MetricKey, string> = {
  avgSatisfaction: "Average Satisfaction by Month",
  budgetStatus: "Budget Status by Month",
  timelineStatus: "Timeline Status by Month",
  onBudgetRate: "On-Budget Rate by Month",
  changeOrdersRevenue: "Change Orders Revenue by Month",
};

const METRIC_OPTIONS: MetricKey[] = [
  "avgSatisfaction",
  "budgetStatus",
  "timelineStatus",
  "onBudgetRate",
  "changeOrdersRevenue",
];

// ---------- Helpers ----------
const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const zeroish = (n: number | null | undefined) =>
  typeof n === "number" && !isNaN(n) ? n : 0;

type MonthlyBuckets = {
  [ym: string]: {
    count: number;
    satsum: number;
    budgetUnder: number;
    budgetOn: number;
    budgetOver: number;
    timelineEarly: number;
    timelineOn: number;
    timelineLate: number;
    changeOrdersRevenue: number;
  };
};

function useMonthlyAggregation(rows: LessonRow[]) {
  const buckets = useMemo<MonthlyBuckets>(() => {
    const b: MonthlyBuckets = {};
    for (const r of rows) {
      const key = monthKey(r.created_at);
      if (!b[key]) {
        b[key] = {
          count: 0, satsum: 0,
          budgetUnder: 0, budgetOn: 0, budgetOver: 0,
          timelineEarly: 0, timelineOn: 0, timelineLate: 0,
          changeOrdersRevenue: 0,
        };
      }
      const m = b[key];
      m.count += 1;
      m.satsum += zeroish(r.satisfaction);

      if (r.budget_status === "under") m.budgetUnder += 1;
      if (r.budget_status === "on") m.budgetOn += 1;
      if (r.budget_status === "over") m.budgetOver += 1;

      if (r.timeline_status === "early") m.timelineEarly += 1;
      if (r.timeline_status === "on") m.timelineOn += 1;
      if (r.timeline_status === "late") m.timelineLate += 1;

      m.changeOrdersRevenue += zeroish(r.change_orders_revenue_usd);
    }
    return Object.fromEntries(
      Object.entries(b).sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [rows]);

  const series = useMemo(() => {
    return Object.entries(buckets).map(([ym, v]) => ({
      month: ym,
      avgSatisfaction: v.count ? +(v.satsum / v.count).toFixed(2) : 0,
      budgetUnder: v.budgetUnder,
      budgetOn: v.budgetOn,
      budgetOver: v.budgetOver,
      timelineEarly: v.timelineEarly,
      timelineOn: v.timelineOn,
      timelineLate: v.timelineLate,
      onBudgetRate: v.count ? +(v.budgetOn / v.count * 100).toFixed(1) : 0,
      changeOrdersRevenue: +v.changeOrdersRevenue.toFixed(0),
      total: v.count,
    }));
  }, [buckets]);

  return series;
}

// ---------- Charts ----------
function WidgetChart({
  metric,
  data,
}: {
  metric: MetricKey;
  data: ReturnType<typeof useMonthlyAggregation>;
}) {
  switch (metric) {
    case "avgSatisfaction":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgSatisfaction" name="Avg Satisfaction" fill={COLORS.purple} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "budgetStatus":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budgetUnder" name="Under" stackId="a" fill={COLORS.green} />
            <Bar dataKey="budgetOn" name="On" stackId="a" fill={COLORS.blue} />
            <Bar dataKey="budgetOver" name="Over" stackId="a" fill={COLORS.red} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "timelineStatus":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="timelineEarly" name="Early" stackId="b" fill={COLORS.green} />
            <Bar dataKey="timelineOn" name="On" stackId="b" fill={COLORS.blue} />
            <Bar dataKey="timelineLate" name="Late" stackId="b" fill={COLORS.red} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "onBudgetRate":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="onBudgetRate"
              name="On-Budget %"
              stroke={COLORS.gold}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    case "changeOrdersRevenue":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend />
            <Bar
              dataKey="changeOrdersRevenue"
              name="Change Orders Revenue"
              fill={COLORS.teal}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
}

// ---------- Reusable card with selector ----------
function MetricCard({
  slotKey,
  metric,
  setMetric,
  data,
}: {
  slotKey: "slotA" | "slotB";
  metric: MetricKey;
  setMetric: (m: MetricKey) => void;
  data: ReturnType<typeof useMonthlyAggregation>;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">{METRIC_LABELS[metric]}</CardTitle>
        <div className="w-64">
          <Select
            value={metric}
            onValueChange={(v) => {
              setMetric(v as MetricKey);
              localStorage.setItem(`analytics:${slotKey}`, v);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Choose metric" /></SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>{METRIC_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <WidgetChart metric={metric} data={data} />
      </CardContent>
    </Card>
  );
}

// ---------- Main page ----------
export default function Analytics() {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore user choices
  const [metricA, setMetricA] = useState<MetricKey>(
    () => (localStorage.getItem("analytics:slotA") as MetricKey) || "avgSatisfaction"
  );
  const [metricB, setMetricB] = useState<MetricKey>(
    () => (localStorage.getItem("analytics:slotB") as MetricKey) || "budgetStatus"
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lessons") // adjust table name if different
        .select(
          "id, project_name, created_at, satisfaction, budget_status, timeline_status, change_request_count, change_orders_approved_count, change_orders_revenue_usd, created_by"
        )
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data || []) as LessonRow[]);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const monthly = useMonthlyAggregation(rows);

  const recent = useMemo(() => {
    // last 10 most recent lessons
    return [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 10);
  }, [rows]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "numeric", day: "numeric" });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            {rows.length} lessons total
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard slotKey="slotA" metric={metricA} setMetric={setMetricA} data={monthly} />
        <MetricCard slotKey="slotB" metric={metricB} setMetric={setMetricB} data={monthly} />
      </div>

      {/* ---------- Recent Lessons table (restored) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.project_name ?? "—"}
                    </TableCell>
                    <TableCell>{fmtDate(r.created_at)}</TableCell>
                    <TableCell>{r.satisfaction ?? "—"}</TableCell>
                    <TableCell className="capitalize">
                      {r.budget_status ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {r.timeline_status ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No lessons found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
