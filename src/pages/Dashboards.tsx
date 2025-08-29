// src/pages/Dashboards.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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

type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

/** Raw row as it may come from Supabase (date field name varies by schema) */
type RawLesson = {
  id: string;
  project_name?: string | null;
  satisfaction?: number | null;
  budget_status?: BudgetStatus;
  timeline_status?: TimelineStatus;
  lesson_date?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  date?: string | null;
};

/** Normalized row we use in the UI */
type LessonRow = {
  id: string;
  project_name: string;
  normalizedDate: string | null; // ISO
  satisfaction: number | null;
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
};

type PresetKey = "30d" | "90d" | "ytd" | "all";

const PRESETS: Record<
  PresetKey,
  { label: string; getRange: () => { from?: string; to?: string } }
> = {
  "30d": {
    label: "Last 30 days",
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      return { from: from.toISOString(), to: to.toISOString() };
    },
  },
  "90d": {
    label: "Last 90 days",
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 90);
      return { from: from.toISOString(), to: to.toISOString() };
    },
  },
  ytd: {
    label: "Year to date",
    getRange: () => {
      const to = new Date();
      const from = new Date(to.getFullYear(), 0, 1);
      return { from: from.toISOString(), to: to.toISOString() };
    },
  },
  all: {
    label: "All time",
    getRange: () => ({}),
  },
};

export default function Dashboards() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [preset, setPreset] = useState<PresetKey>("30d");
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [busy, setBusy] = useState(false);

  const range = useMemo(() => PRESETS[preset].getRange(), [preset]);

  const pickFirstDate = (r: RawLesson): string | null => {
    const candidate = r.lesson_date ?? r.occurred_on ?? r.date ?? r.created_at ?? null;
    if (!ca
