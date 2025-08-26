// src/pages/SubmitWizard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { InfoTip } from "@/components/ui/info-tip";
// TEMP: safe placeholder for InfoTip to rule out hook-order bug
const InfoTipSafe: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => (
  <span className={className} title="info">
    {children}
  </span>
);
type BillingModel = "T&M" | "Fixed Fee";

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
  billing_model?: BillingModel;
  initial_budget_usd?: number;

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
  billing_model: undefined,
  initial_budget_usd: undefined,
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

const numberOrUndefined = (v: any) =>
  v === "" || v === null || typeof v === "undefined" ? undefined : Number(v);

const STEPS = [
  { key: "basics", title: "Project Basics" },
  { key: "delivery", title: "Delivery & Client" },
  { key: "scope", title: "Scope & Change Control" },
  { key: "profit", title: "Profitability & Delivery" },
  { key: "team", title: "Team & Improvement" },
  { key: "review", title: "Review & Submit" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

// Labeled wrapper with InfoTip
const Labeled = ({
  children,
  label,
  help,
  htmlFor,
}: {
  children: React.ReactNode;
  label: string;
  help?: string;
  htmlFor?: string;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {help ? <InfoTipSafe className="h-5 w-5">{help}</InfoTipSafe> : null}
    </div>
    {children}
  </div>
);

// Formatters for Review step
const fmtCurrency = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtPct = (n?: number) => (typeof n === "number" ? `${n}%` : "—");
const fmtNum = (n?: number) => (typeof n === "number" ? String(n) : "—");
const fmtText = (s?: string) => (s && s.trim() ? s : "—");
const fmtBool = (b?: boolean) => (typeof b === "boolean" ? (b ? "Yes" : "No") : "—");

const STORAGE_KEY = "learnd.submit.draft";

const SubmitWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyState);

  // New: success state after submit (show friendly confirmation)
  const [submittedId, setSubmittedId] = useState<string | null>(null);

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

  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / STEPS.length) * 100),
    [stepIndex]
  );

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
      if (!form.billing_model) return "Billing model is required.";
      return null;
    }
    return null;
  };

  const handleNext = () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    next();
  };

  const resetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForm(emptyState);
    setStepIndex(0);
  };

  const submitAll = async () => {
    if (!user?.id) {
      setError("You must be signed in.");
      return;
    }
    setSaving(true);
    setError(null);

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

      // Delivery & client
      change_control_effectiveness: form.change_control_effectiveness ?? null,
      requirements_clarity: form.requirements_clarity ?? null,
      resource_availability: form.resource_availability ?? null,
      skill_alignment: form.skill_alignment ?? null,
      stakeholder_engagement: form.stakeholder_engagement ?? null,
      client_responsiveness: form.client_responsiveness ?? null,
      expectation_alignment: form.expectation_alignment ?? null,

      // Scope & change control
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

      // Profitability extras
      effort_variance_pct: form.effort_variance_pct ?? null,
      rework_pct: form.rework_pct ?? null,
      discounts_concessions_usd: form.discounts_concessions_usd ?? null,
      billing_model: form.billing_model ?? null,
      initial_budget_usd: form.initial_budget_usd ?? null,

      // Team & improvement
      team_morale: form.team_morale ?? null,
      tooling_effectiveness: form.tooling_effectiveness ?? null,
      internal_comms_effectiveness: form.internal_comms_effectiveness ?? null,
      repeat_this: form.repeat_this?.trim() || null,
      avoid_this: form.avoid_this?.trim() || null,
      suggested_improvement_area: form.suggested_improvement_area?.trim() || null,

      // Notes
      notes: form.notes?.trim() || null,

      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("lessons")
      .insert(payload)
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    toast({ title: "Saved", description: "Added to your Lessons Library." });
    setSubmittedId(data?.id ?? null); // show a friendly success screen
    resetDraft();
  };

  // Success screen after submission (friendly, mobile-safe)
  if (submittedId) {
    return (
      <div className="p-4 max-w-3xl mx-auto overflow-x-hidden">
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Lesson added to your Lessons Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <p className="text-muted-foreground">
              Your insights help your team improve project by project. You can review analytics anytime or capture another lesson now.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate("/analytics")}>View Analytics</Button>
              <Button variant="outline" onClick={() => { setSubmittedId(null); setStepIndex(0); }}>
                Add Another Lesson
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto overflow-x-hidden">
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Capture New Lessons</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                Step {stepIndex + 1} of {STEPS.length}:{" "}
                <strong>{STEPS[stepIndex].title}</strong>
              </div>
              <Button variant="ghost" size="sm" onClick={resetDraft}>
                Clear draft
              </Button>
            </div>
            <Progress value={Math.max(0, Math.min(100, progress))} />
          </div>

          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* STEP 1: Basics */}
          {STEPS[stepIndex].key === "basics" && (
            <div className="grid gap-4">
              <Labeled label="Project name *" htmlFor="project_name">
                <Input
                  id="project_name"
                  value={form.project_name}
                  onChange={(e) =>
                    setForm({ ...form, project_name: e.target.value })
                  }
                  required
                />
              </Labeled>

              <Labeled label="Client (optional)" htmlFor="client_name">
                <Input
                  id="client_name"
                  value={form.client_name}
                  onChange={(e) =>
                    setForm({ ...form, client_name: e.target.value })
                  }
                />
              </Labeled>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Labeled label="Role *">
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>

                <Labeled label="Project type">
                  <Select
                    value={form.project_type}
                    onValueChange={(v: any) =>
                      setForm({ ...form, project_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "ERP",
                        "Web",
                        "Mobile",
                        "Migration",
                        "Security",
                        "Data/BI",
                        "CRM",
                        "Infra",
                        "AI/ML",
                        "Other",
                      ].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>

                <Labeled label="Phase">
                  <Select
                    value={form.phase}
                    onValueChange={(v: any) =>
                      setForm({ ...form, phase: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Initiation", "Planning", "Execution", "Closure"].map(
                        (p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </Labeled>

                <Labeled label="Industry">
                  <Select
                    value={form.industry}
                    onValueChange={(v: any) =>
                      setForm({ ...form, industry: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Manufacturing",
                        "Healthcare",
                        "Finance",
                        "Technology",
                        "Retail",
                        "Gov/Nonprofit",
                        "Other",
                      ].map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>

                <Labeled label="Region">
                  <Select
                    value={form.region}
                    onValueChange={(v: any) =>
                      setForm({ ...form, region: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {["NA", "EMEA", "APAC", "LATAM", "Other"].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>
              </div>
            </div>
          )}

          {/* STEP 2: Delivery & Client */}
          {STEPS[stepIndex].key === "delivery" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Satisfaction (1–5) *"
                  help="Overall satisfaction rating from the client team with project outcomes."
                  htmlFor="satisfaction"
                >
                  <Input
                    id="satisfaction"
                    type="number"
                    min={1}
                    max={5}
                    value={form.satisfaction ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        satisfaction: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Requirements clarity (1–5)"
                  help="How clear and complete were the requirements at project start?"
                  htmlFor="requirements_clarity"
                >
                  <Input
                    id="requirements_clarity"
                    type="number"
                    min={1}
                    max={5}
                    value={form.requirements_clarity ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        requirements_clarity: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Change control effectiveness (1–5)"
                  help="How well changes were managed and communicated to all stakeholders."
                  htmlFor="change_control_effectiveness"
                >
                  <Input
                    id="change_control_effectiveness"
                    type="number"
                    min={1}
                    max={5}
                    value={form.change_control_effectiveness ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        change_control_effectiveness: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Resource availability (1–5)"
                  help="Did team members, tools, and environments remain available when needed?"
                  htmlFor="resource_availability"
                >
                  <Input
                    id="resource_availability"
                    type="number"
                    min={1}
                    max={5}
                    value={form.resource_availability ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        resource_availability: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Skill alignment (1–5)"
                  help="How well team members’ skills matched the tasks assigned."
                  htmlFor="skill_alignment"
                >
                  <Input
                    id="skill_alignment"
                    type="number"
                    min={1}
                    max={5}
                    value={form.skill_alignment ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        skill_alignment: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Expectation alignment (1–5)"
                  help="Did the client’s expectations match what was delivered?"
                  htmlFor="expectation_alignment"
                >
                  <Input
                    id="expectation_alignment"
                    type="number"
                    min={1}
                    max={5}
                    value={form.expectation_alignment ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expectation_alignment: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Labeled
                  label="Stakeholder engagement (1–5)"
                  help="How responsive and engaged were stakeholders throughout the project?"
                  htmlFor="stakeholder_engagement"
                >
                  <Input
                    id="stakeholder_engagement"
                    type="number"
                    min={1}
                    max={5}
                    value={form.stakeholder_engagement ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stakeholder_engagement: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Client responsiveness (1–5)"
                  help="Did the client respond promptly to questions, approvals, and feedback?"
                  htmlFor="client_responsiveness"
                >
                  <Input
                    id="client_responsiveness"
                    type="number"
                    min={1}
                    max={5}
                    value={form.client_responsiveness ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client_responsiveness: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>
              </div>
            </div>
          )}

          {/* STEP 3: Scope & Change Control */}
          {STEPS[stepIndex].key === "scope" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Scope baseline quality (1–5)"
                  help="Clarity and completeness of the initial scope definition."
                  htmlFor="scope_baseline_quality"
                >
                  <Input
                    id="scope_baseline_quality"
                    type="number"
                    min={1}
                    max={5}
                    value={form.scope_baseline_quality ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        scope_baseline_quality: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Acceptance criteria completeness (1–5)"
                  help="Were acceptance criteria defined clearly enough for sign-off?"
                  htmlFor="acceptance_criteria_completeness"
                >
                  <Input
                    id="acceptance_criteria_completeness"
                    type="number"
                    min={1}
                    max={5}
                    value={form.acceptance_criteria_completeness ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        acceptance_criteria_completeness: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <div className="flex items-center gap-2 h-10 mt-6">
                  <Checkbox
                    id="assumptions_documented"
                    checked={!!form.assumptions_documented}
                    onCheckedChange={(v) =>
                      setForm({
                        ...form,
                        assumptions_documented: Boolean(v),
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="assumptions_documented">Assumptions documented</Label>
                    <InfoTipSafe>Were key project assumptions recorded early in the project?</InfoTipSafe>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Requirements volatility (count)"
                  help="How many times requirements changed after initial agreement."
                  htmlFor="requirements_volatility_count"
                >
                  <Input
                    id="requirements_volatility_count"
                    type="number"
                    min={0}
                    value={form.requirements_volatility_count ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        requirements_volatility_count: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Scope authority clarity (1–5)"
                  help="How clearly was decision authority over scope defined?"
                  htmlFor="scope_authority_clarity"
                >
                  <Input
                    id="scope_authority_clarity"
                    type="number"
                    min={1}
                    max={5}
                    value={form.scope_authority_clarity ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        scope_authority_clarity: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <div className="flex items-center gap-2 h-10 mt-6">
                  <Checkbox
                    id="change_control_process_used"
                    checked={!!form.change_control_process_used}
                    onCheckedChange={(v) =>
                      setForm({
                        ...form,
                        change_control_process_used: Boolean(v),
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="change_control_process_used">Formal change control process used</Label>
                    <InfoTipSafe>Was a formal, documented change control process followed?</InfoTipSafe>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Change requests (count)"
                  help="How many change requests were logged during the project?"
                  htmlFor="change_request_count"
                >
                  <Input
                    id="change_request_count"
                    type="number"
                    min={0}
                    value={form.change_request_count ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        change_request_count: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Change orders approved (count)"
                  help="How many change requests were approved and became change orders."
                  htmlFor="change_orders_approved_count"
                >
                  <Input
                    id="change_orders_approved_count"
                    type="number"
                    min={0}
                    value={form.change_orders_approved_count ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        change_orders_approved_count: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Avg approval time (days)"
                  help="Average number of days required to approve a change request."
                  htmlFor="change_approval_avg_days"
                >
                  <Input
                    id="change_approval_avg_days"
                    type="number"
                    min={0}
                    value={form.change_approval_avg_days ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        change_approval_avg_days: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 h-10">
                  <Checkbox
                    id="scope_dispute_occurred"
                    checked={!!form.scope_dispute_occurred}
                    onCheckedChange={(v) =>
                      setForm({
                        ...form,
                        scope_dispute_occurred: Boolean(v),
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="scope_dispute_occurred">Scope dispute occurred</Label>
                    <InfoTipSafe>Did the client and delivery team have disputes over scope?</InfoTipSafe>
                  </div>
                </div>

                {form.scope_dispute_occurred ? (
                  <>
                    <Labeled
                      label="Dispute severity (1–5)"
                      help="How severe were scope disputes, if any occurred?"
                      htmlFor="scope_dispute_severity"
                    >
                      <Input
                        id="scope_dispute_severity"
                        type="number"
                        min={1}
                        max={5}
                        value={form.scope_dispute_severity ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            scope_dispute_severity: numberOrUndefined(
                              e.target.value
                            ),
                          })
                        }
                      />
                    </Labeled>

                    <Labeled
                      label="Resolution time (days)"
                      help="How many days were required to resolve scope disputes?"
                      htmlFor="scope_dispute_resolution_days"
                    >
                      <Input
                        id="scope_dispute_resolution_days"
                        type="number"
                        min={0}
                        value={form.scope_dispute_resolution_days ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            scope_dispute_resolution_days: numberOrUndefined(
                              e.target.value
                            ),
                          })
                        }
                      />
                    </Labeled>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* STEP 4: Profitability & Delivery */}
          {STEPS[stepIndex].key === "profit" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Budget status *"
                  help="Did the project finish under, on, or over budget?"
                >
                  <Select
                    value={form.budget_status}
                    onValueChange={(v: any) =>
                      setForm({ ...form, budget_status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under">Under</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="over">Over</SelectItem>
                    </SelectContent>
                  </Select>
                </Labeled>

                <Labeled
                  label="Timeline status *"
                  help="Was the project delivered earlier than planned, on time, or late?"
                >
                  <Select
                    value={form.timeline_status}
                    onValueChange={(v: any) =>
                      setForm({ ...form, timeline_status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early">Early</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </Labeled>

                <div className="flex items-center gap-2 h-10 mt-6">
                  <Checkbox
                    id="scope_change"
                    checked={!!form.scope_change}
                    onCheckedChange={(v) =>
                      setForm({ ...form, scope_change: Boolean(v) })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="scope_change">Scope changed</Label>
                    <InfoTipSafe>Did the project scope expand or change beyond the baseline?</InfoTipSafe>
                  </div>
                </div>
              </div>

              {/* Billing model & Initial budget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Billing model *"
                  help="Contract type for the project: Time & Materials or Fixed Fee."
                >
                  <Select
                    value={form.billing_model}
                    onValueChange={(v: BillingModel) =>
                      setForm({ ...form, billing_model: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T&M">T&amp;M</SelectItem>
                      <SelectItem value="Fixed Fee">Fixed Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </Labeled>

                <Labeled
                  label="Initial budget (USD)"
                  help="The project’s initial approved budget before change orders."
                  htmlFor="initial_budget_usd"
                >
                  <Input
                    id="initial_budget_usd"
                    type="number"
                    step="1"
                    min={0}
                    value={form.initial_budget_usd ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        initial_budget_usd: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled
                  label="Effort variance %"
                  help="% difference between estimated vs. actual effort expended."
                  htmlFor="effort_variance_pct"
                >
                  <Input
                    id="effort_variance_pct"
                    type="number"
                    step="0.01"
                    value={form.effort_variance_pct ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        effort_variance_pct: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Rework %"
                  help="% of effort spent on rework (fixes, re-doing tasks)."
                  htmlFor="rework_pct"
                >
                  <Input
                    id="rework_pct"
                    type="number"
                    step="0.01"
                    value={form.rework_pct ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        rework_pct: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Discounts / concessions (USD)"
                  help="Value of discounts or concessions given to the client."
                  htmlFor="discounts_concessions_usd"
                >
                  <Input
                    id="discounts_concessions_usd"
                    type="number"
                    step="0.01"
                    value={form.discounts_concessions_usd ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discounts_concessions_usd: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Labeled
                  label="Planned duration (days)"
                  help="Planned project length in days."
                  htmlFor="planned_days"
                >
                  <Input
                    id="planned_days"
                    type="number"
                    min={0}
                    value={form.planned_days ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        planned_days: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Actual duration (days)"
                  help="Actual project length in days."
                  htmlFor="actual_days"
                >
                  <Input
                    id="actual_days"
                    type="number"
                    min={0}
                    value={form.actual_days ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        actual_days: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>
              </div>

              <Labeled
                label="Change order revenue (USD)"
                help="Additional revenue generated through approved change orders."
                htmlFor="change_orders_revenue_usd"
              >
                <Input
                  id="change_orders_revenue_usd"
                  type="number"
                  step="0.01"
                  value={form.change_orders_revenue_usd ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      change_orders_revenue_usd: numberOrUndefined(
                        e.target.value
                      ),
                    })
                  }
                />
              </Labeled>
            </div>
          )}

          {/* STEP 5: Team & Improvement */}
          {STEPS[stepIndex].key === "team" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Labeled label="Team morale (1–5)" htmlFor="team_morale">
                  <Input
                    id="team_morale"
                    type="number"
                    min={1}
                    max={5}
                    value={form.team_morale ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        team_morale: numberOrUndefined(e.target.value),
                      })
                    }
                  />
                </Labeled>

                <Labeled label="Tooling effectiveness (1–5)" htmlFor="tooling_effectiveness">
                  <Input
                    id="tooling_effectiveness"
                    type="number"
                    min={1}
                    max={5}
                    value={form.tooling_effectiveness ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tooling_effectiveness: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>

                <Labeled
                  label="Internal comms effectiveness (1–5)"
                  htmlFor="internal_comms_effectiveness"
                >
                  <Input
                    id="internal_comms_effectiveness"
                    type="number"
                    min={1}
                    max={5}
                    value={form.internal_comms_effectiveness ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        internal_comms_effectiveness: numberOrUndefined(
                          e.target.value
                        ),
                      })
                    }
                  />
                </Labeled>
              </div>

              <Labeled label="What should we repeat?">
                <Textarea
                  rows={3}
                  value={form.repeat_this ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, repeat_this: e.target.value })
                  }
                />
              </Labeled>

              <Labeled label="What should we avoid?">
                <Textarea
                  rows={3}
                  value={form.avoid_this ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, avoid_this: e.target.value })
                  }
                />
              </Labeled>

              <Labeled label="Suggested improvement area">
                <Input
                  value={form.suggested_improvement_area ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      suggested_improvement_area: e.target.value,
                    })
                  }
                  placeholder="process, tooling, staffing, client, risk, comms, other"
                />
              </Labeled>

              <Labeled label="General notes">
                <Textarea
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Labeled>
            </div>
          )}

          {/* STEP 6: Review – grouped, readable summary */}
          {STEPS[stepIndex].key === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review your entries. When you submit, we’ll add one lesson to your team’s
                <span className="font-medium"> Lessons Library</span>.
              </p>

              <div className="grid gap-4">
                <Card className="w-full overflow-hidden">
                  <CardHeader><CardTitle className="text-base">Project Basics</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Project:</span> {fmtText(form.project_name)}</div>
                    <div><span className="text-muted-foreground">Client:</span> {fmtText(form.client_name)}</div>
                    <div><span className="text-muted-foreground">Role:</span> {fmtText(form.role)}</div>
                    <div><span className="text-muted-foreground">Type:</span> {fmtText(form.project_type)}</div>
                    <div><span className="text-muted-foreground">Phase:</span> {fmtText(form.phase)}</div>
                    <div><span className="text-muted-foreground">Industry:</span> {fmtText(form.industry)}</div>
                    <div><span className="text-muted-foreground">Region:</span> {fmtText(form.region)}</div>
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardHeader><CardTitle className="text-base">Delivery & Client</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Satisfaction:</span> {fmtNum(form.satisfaction)}</div>
                    <div><span className="text-muted-foreground">Req clarity:</span> {fmtNum(form.requirements_clarity)}</div>
                    <div><span className="text-muted-foreground">Change control eff.:</span> {fmtNum(form.change_control_effectiveness)}</div>
                    <div><span className="text-muted-foreground">Resource availability:</span> {fmtNum(form.resource_availability)}</div>
                    <div><span className="text-muted-foreground">Skill alignment:</span> {fmtNum(form.skill_alignment)}</div>
                    <div><span className="text-muted-foreground">Expectation alignment:</span> {fmtNum(form.expectation_alignment)}</div>
                    <div><span className="text-muted-foreground">Stakeholder engagement:</span> {fmtNum(form.stakeholder_engagement)}</div>
                    <div><span className="text-muted-foreground">Client responsiveness:</span> {fmtNum(form.client_responsiveness)}</div>
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardHeader><CardTitle className="text-base">Scope & Change Control</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Baseline quality:</span> {fmtNum(form.scope_baseline_quality)}</div>
                    <div><span className="text-muted-foreground">Acceptance criteria:</span> {fmtNum(form.acceptance_criteria_completeness)}</div>
                    <div><span className="text-muted-foreground">Assumptions documented:</span> {fmtBool(form.assumptions_documented)}</div>
                    <div><span className="text-muted-foreground">Req volatility (cnt):</span> {fmtNum(form.requirements_volatility_count)}</div>
                    <div><span className="text-muted-foreground">Scope authority clarity:</span> {fmtNum(form.scope_authority_clarity)}</div>
                    <div><span className="text-muted-foreground">Formal change control:</span> {fmtBool(form.change_control_process_used)}</div>
                    <div><span className="text-muted-foreground">Change requests:</span> {fmtNum(form.change_request_count)}</div>
                    <div><span className="text-muted-foreground">Change orders approved:</span> {fmtNum(form.change_orders_approved_count)}</div>
                    <div><span className="text-muted-foreground">Avg approval (days):</span> {fmtNum(form.change_approval_avg_days)}</div>
                    <div><span className="text-muted-foreground">Scope dispute:</span> {fmtBool(form.scope_dispute_occurred)}</div>
                    {form.scope_dispute_occurred ? (
                      <>
                        <div><span className="text-muted-foreground">Dispute severity:</span> {fmtNum(form.scope_dispute_severity)}</div>
                        <div><span className="text-muted-foreground">Resolution (days):</span> {fmtNum(form.scope_dispute_resolution_days)}</div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardHeader><CardTitle className="text-base">Profitability & Delivery</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Budget status:</span> {fmtText(form.budget_status)}</div>
                    <div><span className="text-muted-foreground">Timeline status:</span> {fmtText(form.timeline_status)}</div>
                    <div><span className="text-muted-foreground">Scope changed:</span> {fmtBool(form.scope_change)}</div>
                    <div><span className="text-muted-foreground">Billing model:</span> {fmtText(form.billing_model)}</div>
                    <div><span className="text-muted-foreground">Initial budget:</span> {fmtCurrency(form.initial_budget_usd)}</div>
                    <div><span className="text-muted-foreground">Effort variance:</span> {fmtPct(form.effort_variance_pct)}</div>
                    <div><span className="text-muted-foreground">Rework:</span> {fmtPct(form.rework_pct)}</div>
                    <div><span className="text-muted-foreground">Discounts:</span> {fmtCurrency(form.discounts_concessions_usd)}</div>
                    <div><span className="text-muted-foreground">Planned days:</span> {fmtNum(form.planned_days)}</div>
                    <div><span className="text-muted-foreground">Actual days:</span> {fmtNum(form.actual_days)}</div>
                    <div><span className="text-muted-foreground">CO revenue:</span> {fmtCurrency(form.change_orders_revenue_usd)}</div>
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardHeader><CardTitle className="text-base">Team & Improvement</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Team morale:</span> {fmtNum(form.team_morale)}</div>
                    <div><span className="text-muted-foreground">Tooling effectiveness:</span> {fmtNum(form.tooling_effectiveness)}</div>
                    <div><span className="text-muted-foreground">Comms effectiveness:</span> {fmtNum(form.internal_comms_effectiveness)}</div>
                    <div className="sm:col-span-3"><span className="text-muted-foreground">Repeat:</span> {fmtText(form.repeat_this)}</div>
                    <div className="sm:col-span-3"><span className="text-muted-foreground">Avoid:</span> {fmtText(form.avoid_this)}</div>
                    <div className="sm:col-span-3"><span className="text-muted-foreground">Suggested improvement:</span> {fmtText(form.suggested_improvement_area)}</div>
                    <div className="sm:col-span-3"><span className="text-muted-foreground">Notes:</span> {fmtText(form.notes)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={submitAll} disabled={saving}>
                  {saving ? "Saving…" : "Submit Lesson"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStepIndex(stepIndex - 1)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* NAV */}
          {STEPS[stepIndex].key !== "review" && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepIndex(stepIndex - 1)}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitWizard;
