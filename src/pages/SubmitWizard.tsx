import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntelligentClientInput } from "@/components/forms/IntelligentClientInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on-time" | "late";
type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";

type FormState = {
  project_name: string;
  client_name: string;
  project_status: ProjectStatus;
  satisfaction: number | null;
  budget_status: BudgetStatus | "";
  timeline_status: TimelineStatus | "";
  status_change_reason?: string;
  completion_summary?: string;
  notes?: string;
};

const initialForm: FormState = {
  project_name: "",
  client_name: "",
  project_status: "active", // Default new projects to active
  satisfaction: null,
  budget_status: "",
  timeline_status: "",
};

export default function SubmitWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [form]);

  const canSubmit =
    !!form.project_name &&
    !!form.project_status &&
    typeof form.satisfaction === "number" &&
    form.satisfaction >= 1 &&
    form.satisfaction <= 5 &&
    !!form.budget_status &&
    !!form.timeline_status &&
    // Additional validation for specific statuses
    (form.project_status !== 'completed' || !!form.completion_summary) &&
    (form.project_status !== 'on_hold' || !!form.status_change_reason);

  async function handleSubmit() {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a lesson.",
        variant: "destructive",
      });
      return;
    }
    if (!canSubmit) return;

    try {
      setSaving(true);
      setError(null);

      // Send columns that exist in the database including project_status
      const payload = {
        project_name: form.project_name,
        client_name: form.client_name || null,
        project_status: form.project_status,
        satisfaction: form.satisfaction!,
        budget_status: form.budget_status as BudgetStatus,
        timeline_status: form.timeline_status as TimelineStatus,
        notes: form.notes || null,
        role: "project_manager", // Required field
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("lessons")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      toast({
        title: "Submitted",
        description: "Your lesson has been saved.",
      });

      // Go to Lessons list
      navigate("/lessons");
    } catch (e: any) {
      console.error("SubmitWizard insert failed:", e);
      setError(e?.message ?? "Could not save lesson.");
      toast({
        title: "Save failed",
        description: e?.message ?? "Unable to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Lesson</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project name</Label>
              <Input
                id="project"
                placeholder="e.g., Website Redesign"
                value={form.project_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, project_name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client (optional)</Label>
              <IntelligentClientInput
                value={form.client_name}
                onChange={(value) =>
                  setForm((f) => ({ ...f, client_name: value }))
                }
                placeholder="e.g., Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_status">Project Status</Label>
              <Select
                value={form.project_status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    project_status: v as ProjectStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="satisfaction">Satisfaction (1–5)</Label>
                <Input
                  id="satisfaction"
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  inputMode="numeric"
                  placeholder="e.g., 4"
                  value={form.satisfaction ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      satisfaction:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Budget status</Label>
                <Select
                  value={form.budget_status}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      budget_status: v as BudgetStatus | "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under">Under</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="over">Over</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timeline status</Label>
                <Select
                  value={form.timeline_status}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      timeline_status: v as TimelineStatus | "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early">Early</SelectItem>
                    <SelectItem value="on-time">On Time</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status-specific fields */}
            {form.project_status === 'completed' && (
              <div className="space-y-4 p-4 border rounded-md bg-blue-50">
                <h4 className="font-medium text-blue-800">Completion Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="completion_summary">Completion Summary</Label>
                  <Textarea
                    id="completion_summary"
                    placeholder="Summarize key outcomes and lessons learned..."
                    value={form.completion_summary || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, completion_summary: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}

            {form.project_status === 'on_hold' && (
              <div className="space-y-4 p-4 border rounded-md bg-yellow-50">
                <h4 className="font-medium text-yellow-800">On Hold Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="status_change_reason">Reason for Hold</Label>
                  <Textarea
                    id="status_change_reason"
                    placeholder="Describe why the project is on hold..."
                    value={form.status_change_reason || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status_change_reason: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or context..."
                value={form.notes || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
              {saving ? "Saving…" : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
