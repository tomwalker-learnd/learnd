import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type FormState = {
  // Step 1: Basics
  project_name: string;
  client_name: string;
  role: string;
  project_type: "ERP" | "Web" | "Mobile" | "Migration" | "Security" | "Data/BI" | "CRM" | "Infra" | "AI/ML" | "Other" | "";
  phase: "Initiation" | "Planning" | "Execution" | "Closure" | "";
  industry: "Manufacturing" | "Healthcare" | "Finance" | "Technology" | "Retail" | "Gov/Nonprofit" | "Other" | "";
  region: "NA" | "EMEA" | "APAC" | "LATAM" | "Other" | "";

  // Step 2: Delivery & Client
  satisfaction: number | undefined;
  change_control_effectiveness?: number;
  requirements_clarity?: number;
  resource_availability?: number;
  skill_alignment?: number;
  stakeholder_engagement?: number;
  client_responsiveness?: number;
  expectation_alignment?: number;

  // Step 3: Scope & Change Control
  scope_baseline_quality?: number;
  acceptance_criteria_completeness?: number;
  assumptions_documented?: boolean;
  requirements_volatility_count?: number;
  scope_authority_clarity?: number;
  change_control_process_used?: boolean;
  change_request_count?: number;
  change_orders_approved_count?: number;
  change_orders_revenue_usd?: number;
  change_approval_avg_days?: number;
  scope_dispute_occurred?: boolean;
  scope_dispute_severity?: number;
  scope_dispute_resolution_days?: number;

  // Step 4: Profitability & Delivery
  budget_status: "under" | "on" | "over" | "";
  timeline_status: "early" | "on" | "late" | "";
  scope_change?: boolean;
  effort_variance_pct?: number;
  rework_pct?: number;
  discounts_concessions_usd?: number;
  planned_days?: number;
  actual_days?: number;

  // Step 5: Team & Improvement
  team_morale?: number;
  tooling_effectiveness?: number;
  internal_comms_effectiveness?: number;
  repeat_this?: string;
  avoid_this?: string;
  suggested_improvement_area?: string;

  // Notes
  notes?: string;
};

const emptyState: FormState = {
  project_name: "",
  client_name: "",
  role: "",
  project_type: "",
  phase: "",
  industry: "",
  region: "",
  satisfaction: undefined,
  budget_status: "",
  timeline_status: "",
};

const roles = [
  "Project Manager",
  "Consultant",
  "Developer",
  "Support Engineer",
  "Salesperson",
  "Product Manager",
  "Business Analyst",
];

const numberOrUndefined = (v: any) => (v === "" || v === null || typeof v === "undefined" ? undefined : Number(v));

const STEPS = [
  { key: "basics", title: "Project Basics" },
  { key: "delivery", title: "Delivery & Client" },
  { key: "scope", title: "Scope & Change Control" },
  { key: "profit", title: "Profitability & Delivery" },
  { key: "team", title: "Team & Improvement" },
  { key: "review", title: "Review & Submit" },
] as const;
type StepKey = typeof STEPS[number]["key"];

const STORAGE_KEY = "learnd.submit.draft";

const SubmitWizard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyState);

  // load draft
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setForm({ ...emptyState, ...JSON.parse(s) });
    } catch {}
  }, []);

  // autosave
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }, 300);
    return () => clearTimeout(id);
  }, [form]);

  const progress = useMemo(() => Math.round(((stepIndex + 1) / STEPS.length) * 100), [stepIndex]);

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const validateStep = (): string | null => {
    const s = STEPS[stepIndex].key as StepKey;
    if (s === "basics") {
      if (!form.project_name) return "Project name is required.";
      if (!form.role) return "Role is required.";
      return null;
    }
    if (s === "delivery") {
      if (!form.satisfaction) return "Satisfaction (1–5) is required.";
      return null;
    }
    if (s === "profit") {
      if (!form.budget_status) return "Budget status is required.";
      if (!form.timeline_status) return "Timeline status is required.";
      return null;
    }
    return null;
  };

  const handleNext = () => {
    const v = validateStep();
    if (v) { setError(v); return; }
    setError(null);
    next();
  };

  const resetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForm(emptyState);
    setStepIndex(0);
  };

  const submitAll = async () => {
    if (!user?.id) { setError("You must be signed in."); return; }
    setSaving(true); setError(null);

    const payload = {
      project_name: form.project_name,
      client_name: form.client_name || null,
      role: form.role,
      project_type: form.project_type || null,
      phase: form.phase || null,
      industry: form.industry || null,
      region: form.region || null,
      satisfaction: form.satisfaction!,
      budget_status: form.budget_status as "under" | "on" | "over",
      timeline_status: form.timeline_status as "early" | "on" | "late",
      scope_change: !!form.scope_change,
      planned_days: form.planned_days ?? null,
      actual_days: form.actual_days ?? null,

      change_control_effectiveness: form.change_control_effectiveness ?? null,
      requirements_clarity: form.requirements_clarity ?? null,
      resource_availability: form.resource_availability ?? null,
      skill_alignment: form.skill_alignment ?? null,
      stakeholder_engagement: form.stakeholder_engagement ?? null,
      client_responsiveness: form.client_responsiveness ?? null,
      expectation_alignment: form.expectation_alignment ?? null,

      scope_baseline_quality: form.scope_baseline_quality ?? null,
      acceptance_criteria_completeness: form.acceptance_criteria_completeness ?? null,
      assumptions_documented: form.assumptions_documented ?? null,
      requirements_volatility_count: form.requirements_volatility_count ?? null,
      scope_authority_clarity: form.scope_authority_clarity ?? null,
      change_control_process_used: form.change_control_process_used ?? null,
      change_request_count: form.change_request_count ?? null,
      change_orders_approved_count: form.change_orders_approved_count ?? null,
      change_orders_revenue_usd: form.change_orders_revenue_usd ?? null,
      change_approval_avg_days: form.change_approval_avg_days ?? null,
      scope_dispute_occurred: form.scope_dispute_occurred ?? null,
      scope_dispute_severity: form.scope_dispute_severity ?? null,
      scope_dispute_resolution_days: form.scope_dispute_resolution_days ?? null,

      effort_variance_pct: form.effort_variance_pct ?? null,
      rework_pct: form.rework_pct ?? null,
      discounts_concessions_usd: form.discounts_concessions_usd ?? null,

      team_morale: form.team_morale ?? null,
      tooling_effectiveness: form.tooling_effectiveness ?? null,
      internal_comms_effectiveness: form.internal_comms_effectiveness ?? null,
      repeat_this: form.repeat_this?.trim() || null,
      avoid_this: form.avoid_this?.trim() || null,
      suggested_improvement_area: form.suggested_improvement_area?.trim() || null,

      notes: form.notes?.trim() || null,
      created_by: user.id,
    };

    const { error } = await supabase.from("lessons").insert(payload);
    setSaving(false);

    if (error) { setError(error.message); return; }
    toast({ title: "Saved", description: "Lesson captured." });
    resetDraft();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Capture New Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                Step {stepIndex + 1} of {STEPS.length}: <strong>{STEPS[stepIndex].title}</strong>
              </div>
              <Button variant="ghost" size="sm" onClick={resetDraft}>Clear draft</Button>
            </div>
            <Progress value={Math.max(0, Math.min(100, progress))} />
          </div>

          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basics */}
          {STEPS[stepIndex].key === "basics" && (
            <div className="grid gap-4">
              <div>
                <Label>Project name *</Label>
                <Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required />
              </div>
              <div>
                <Label>Client (optional)</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project type</Label>
                  <Select value={form.project_type} onValueChange={(v: any) => setForm({ ...form, project_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {["ERP","Web","Mobile","Migration","Security","Data/BI","CRM","Infra","AI/ML","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phase</Label>
                  <Select value={form.phase} onValueChange={(v: any) => setForm({ ...form, phase: v })}>
                    <SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger>
                    <SelectContent>
                      {["Initiation","Planning","Execution","Closure"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Industry</Label>
                  <Select value={form.industry} onValueChange={(v: any) => setForm({ ...form, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {["Manufacturing","Healthcare","Finance","Technology","Retail","Gov/Nonprofit","Other"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Region</Label>
                  <Select value={form.region} onValueChange={(v: any) => setForm({ ...form, region: v })}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {["NA","EMEA","APAC","LATAM","Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Delivery & Client */}
          {STEPS[stepIndex].key === "delivery" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Satisfaction (1–5) *</Label>
                  <Input type="number" min={1} max={5} value={form.satisfaction ?? ""} onChange={(e) => setForm({ ...form, satisfaction: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Requirements clarity (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.requirements_clarity ?? ""} onChange={(e) => setForm({ ...form, requirements_clarity: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Change control effectiveness (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.change_control_effectiveness ?? ""} onChange={(e) => setForm({ ...form, change_control_effectiveness: numberOrUndefined(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Resource availability (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.resource_availability ?? ""} onChange={(e) => setForm({ ...form, resource_availability: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Skill alignment (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.skill_alignment ?? ""} onChange={(e) => setForm({ ...form, skill_alignment: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Expectation alignment (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.expectation_alignment ?? ""} onChange={(e) => setForm({ ...form, expectation_alignment: numberOrUndefined(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Stakeholder engagement (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.stakeholder_engagement ?? ""} onChange={(e) => setForm({ ...form, stakeholder_engagement: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Client responsiveness (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.client_responsiveness ?? ""} onChange={(e) => setForm({ ...form, client_responsiveness: numberOrUndefined(e.target.value) })} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Scope & Change Control */}
          {STEPS[stepIndex].key === "scope" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Scope baseline quality (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.scope_baseline_quality ?? ""} onChange={(e) => setForm({ ...form, scope_baseline_quality: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Acceptance criteria completeness (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.acceptance_criteria_completeness ?? ""} onChange={(e) => setForm({ ...form, acceptance_criteria_completeness: numberOrUndefined(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 h-10 mt-6">
                  <Checkbox checked={!!form.assumptions_documented} onCheckedChange={(v) => setForm({ ...form, assumptions_documented: Boolean(v) })} />
                  <span className="text-sm">Assumptions documented</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Requirements volatility (count)</Label>
                  <Input type="number" min={0} value={form.requirements_volatility_count ?? ""} onChange={(e) => setForm({ ...form, requirements_volatility_count: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Scope authority clarity (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.scope_authority_clarity ?? ""} onChange={(e) => setForm({ ...form, scope_authority_clarity: numberOrUndefined(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 h-10 mt-6">
                  <Checkbox checked={!!form.change_control_process_used} onCheckedChange={(v) => setForm({ ...form, change_control_process_used: Boolean(v) })} />
                  <span className="text-sm">Formal change control process used</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Change requests (count)</Label>
                  <Input type="number" min={0} value={form.change_request_count ?? ""} onChange={(e) => setForm({ ...form, change_request_count: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Change orders approved (count)</Label>
                  <Input type="number" min={0} value={form.change_orders_approved_count ?? ""} onChange={(e) => setForm({ ...form, change_orders_approved_count: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Avg approval time (days)</Label>
                  <Input type="number" min={0} value={form.change_approval_avg_days ?? ""} onChange={(e) => setForm({ ...form, change_approval_avg_days: numberOrUndefined(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 h-10">
                  <Checkbox checked={!!form.scope_dispute_occurred} onCheckedChange={(v) => setForm({ ...form, scope_dispute_occurred: Boolean(v) })} />
                  <span className="text-sm">Scope dispute occurred</span>
                </div>
                {form.scope_dispute_occurred ? (
                  <>
                    <div>
                      <Label>Dispute severity (1–5)</Label>
                      <Input type="number" min={1} max={5} value={form.scope_dispute_severity ?? ""} onChange={(e) => setForm({ ...form, scope_dispute_severity: numberOrUndefined(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Resolution time (days)</Label>
                      <Input type="number" min={0} value={form.scope_dispute_resolution_days ?? ""} onChange={(e) => setForm({ ...form, scope_dispute_resolution_days: numberOrUndefined(e.target.value) })} />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Step 4: Profitability & Delivery */}
          {STEPS[stepIndex].key === "profit" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Budget status *</Label>
                  <Select value={form.budget_status} onValueChange={(v: any) => setForm({ ...form, budget_status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under">Under</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="over">Over</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeline status *</Label>
                  <Select value={form.timeline_status} onValueChange={(v: any) => setForm({ ...form, timeline_status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early">Early</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 h-10 mt-6">
                  <Checkbox checked={!!form.scope_change} onCheckedChange={(v) => setForm({ ...form, scope_change: Boolean(v) })} />
                  <span className="text-sm">Scope changed</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Effort variance %</Label>
                  <Input type="number" step="0.01" value={form.effort_variance_pct ?? ""} onChange={(e) => setForm({ ...form, effort_variance_pct: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Rework %</Label>
                  <Input type="number" step="0.01" value={form.rework_pct ?? ""} onChange={(e) => setForm({ ...form, rework_pct: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Discounts / concessions (USD)</Label>
                  <Input type="number" step="0.01" value={form.discounts_concessions_usd ?? ""} onChange={(e) => setForm({ ...form, discounts_concessions_usd: numberOrUndefined(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Planned duration (days)</Label>
                  <Input type="number" min={0} value={form.planned_days ?? ""} onChange={(e) => setForm({ ...form, planned_days: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Actual duration (days)</Label>
                  <Input type="number" min={0} value={form.actual_days ?? ""} onChange={(e) => setForm({ ...form, actual_days: numberOrUndefined(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label>Change order revenue (USD)</Label>
                <Input type="number" step="0.01" value={form.change_orders_revenue_usd ?? ""} onChange={(e) => setForm({ ...form, change_orders_revenue_usd: numberOrUndefined(e.target.value) })} />
              </div>
            </div>
          )}

          {/* Step 5: Team & Improvement */}
          {STEPS[stepIndex].key === "team" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Team morale (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.team_morale ?? ""} onChange={(e) => setForm({ ...form, team_morale: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Tooling effectiveness (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.tooling_effectiveness ?? ""} onChange={(e) => setForm({ ...form, tooling_effectiveness: numberOrUndefined(e.target.value) })} />
                </div>
                <div>
                  <Label>Internal comms effectiveness (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.internal_comms_effectiveness ?? ""} onChange={(e) => setForm({ ...form, internal_comms_effectiveness: numberOrUndefined(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label>What should we repeat?</Label>
                <Textarea rows={3} value={form.repeat_this ?? ""} onChange={(e) => setForm({ ...form, repeat_this: e.target.value })} />
              </div>
              <div>
                <Label>What should we avoid?</Label>
                <Textarea rows={3} value={form.avoid_this ?? ""} onChange={(e) => setForm({ ...form, avoid_this: e.target.value })} />
              </div>
              <div>
                <Label>Suggested improvement area</Label>
                <Input value={form.suggested_improvement_area ?? ""} onChange={(e) => setForm({ ...form, suggested_improvement_area: e.target.value })} placeholder="process, tooling, staffing, client, risk, comms, other" />
              </div>

              <div>
                <Label>General notes</Label>
                <Textarea rows={4} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {STEPS[stepIndex].key === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review your entries. When you submit, we’ll create a single record in <code>public.lessons</code>.
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{JSON.stringify(form, null, 2)}</pre>
              <div className="flex items-center gap-2">
                <Button onClick={submitAll} disabled={saving}>{saving ? "Saving…" : "Submit Lesson"}</Button>
                <Button type="button" variant="outline" onClick={() => setStepIndex(stepIndex - 1)}>Back</Button>
              </div>
            </div>
          )}

          {/* NAV */}
          {STEPS[stepIndex].key !== "review" && (
            <div className="mt-6 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setStepIndex(stepIndex - 1)} disabled={stepIndex === 0}>Back</Button>
              <Button type="button" onClick={handleNext}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitWizard;
