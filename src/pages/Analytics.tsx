// src/pages/Analytics.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";

// --- Types --- //
type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string; // ISO
  satisfaction: number | null; // 1-5
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

// --- Metric registry --- //
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

// --- Helpers --- //
const monthKey = (iso: string) => {
  const d = new Date(iso);
  // YYYY-MM
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function zeroish(n: number | null | undefined) {
  return typeof n === "number" && !isNaN(n) ? n : 0;
}

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

// Aggregate once; reuse everywhere
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

      switch (r.budget_status) {
        case "under": m.budgetUnder += 1; break;
        case "on": m.budgetOn += 1; break;
        case "over": m.budgetOver += 1; break;
      }
      switch (r.timeline_status) {
        case "early": m.timelineEarly += 1; break;
        case "on": m.timelineOn += 1; break;
        case "late": m.timelineLate += 1; break;
      }

      m.changeOrdersRevenue += zeroish(r.change_orders_revenue_usd);
    }
    // return array sorted by month ascending
    const entries = Object.entries(b).sort((a,b) => a[0].localeCompare(b[0]));
    return Object.fromEntries(entries);
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

// --- Widget renderer --- //
function WidgetChart({ metric, data }: { metric: MetricKey; data: ReturnType<typeof useMonthlyAggregation> }) {
  switch (metric) {
    case "avgSatisfaction":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgSatisfaction" name="Avg Satisfaction" />
          </BarChart>
        </ResponsiveContainer>
      );
    case "budgetStatus":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} stackOffset="sign">
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budgetUnder" name="Under" stackId="a" />
            <Bar dataKey="budgetOn" name="On" stackId="a" />
            <Bar dataKey="budgetOver" name="Over" stackId="a" />
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
            <Bar dataKey="timelineEarly" name="Early" stackId="b" />
            <Bar dataKey="timelineOn" name="On" stackId="b" />
            <Bar dataKey="timelineLate" name="Late" stackId="b" />
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
            <Line type="monotone" dataKey="onBudgetRate" name="On-Budget %" />
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
            <Bar dataKey="changeOrdersRevenue" name="Change Orders Revenue" />
          </BarChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
}

// --- Reusable card with selector --- //
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
        <div className="w-56">
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

// --- Main page --- //
export default function Analytics() {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  // restore persisted selection
  const [metricA, setMetricA] = useState<MetricKey>(() => (localStorage.getItem("analytics:slotA") as MetricKey) || "avgSatisfaction");
  const [metricB, setMetricB] = useState<MetricKey>(() => (localStorage.getItem("analytics:slotB") as MetricKey) || "budgetStatus");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lessons") // <-- adjust table name if needed
        .select("id, project_name, created_at, satisfaction, budget_status, timeline_status, change_request_count, change_orders_approved_count, change_orders_revenue_usd, created_by")
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">{rows.length} lessons total</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard slotKey="slotA" metric={metricA} setMetric={setMetricA} data={monthly} />
        <MetricCard slotKey="slotB" metric={metricB} setMetric={setMetricB} data={monthly} />
      </div>

      {/* keep your Recent Lessons section below as-is */}
    </div>
  );
}
