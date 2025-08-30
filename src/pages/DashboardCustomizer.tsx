import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type CustomFilters = {
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  project?: string;
  budgetStatus?: BudgetStatus;
  timelineStatus?: TimelineStatus;
  satisfactionMin?: number;
  owner?: string;
  tags?: string[];
};

export default function DashboardCustomizer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // form state
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<CustomFilters>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Please give your dashboard a name" });
      return;
    }
    setSaving(true);

    // TODO: Re-enable when saved_dashboards table is properly typed
    toast({ variant: "destructive", title: "Dashboard creation temporarily disabled" });
    setSaving(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Dashboard</CardTitle>
          <CardDescription>
            Define criteria to filter lessons. Save to return and view your custom dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Customer X last quarter"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Example filters — extend with your real fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Customer</Label>
              <Input
                placeholder="Optional"
                value={filters.customer ?? ""}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Input
                placeholder="Optional"
                value={filters.project ?? ""}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Budget Status</Label>
              <Select
                value={filters.budgetStatus}
                onValueChange={(v: BudgetStatus) => setFilters({ ...filters, budgetStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under">Under</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="over">Over</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeline Status</Label>
              <Select
                value={filters.timelineStatus}
                onValueChange={(v: TimelineStatus) => setFilters({ ...filters, timelineStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Satisfaction</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={filters.satisfactionMin ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, satisfactionMin: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>

          </div>

          {/* Save + Cancel */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-orange-400 to-fuchsia-500 hover:opacity-95"
            >
              {saving ? "Saving…" : "Save & Return"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/dashboards")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
