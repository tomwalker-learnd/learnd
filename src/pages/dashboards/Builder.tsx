import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Star } from "lucide-react";

export default function Builder() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();

  // Basic fields
  const [name, setName] = useState("Untitled Dashboard");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "team" | "org">("private");
  const [isFavorite, setIsFavorite] = useState<boolean>(true);

  // Minimal filter UI (single rule) – expand later
  const [filterField, setFilterField] = useState<string>("salesperson");
  const [filterValue, setFilterValue] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!user?.id) {
      toast({ title: "Not signed in", description: "Please sign in to save dashboards.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your dashboard a name.", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Build a minimal config payload
    const filterRules =
      filterValue.trim()
        ? [{ field: filterField, op: "eq", value: filterValue.trim() }]
        : [];

    const payload = {
      name,
      description,
      visibility,
      is_favorite: isFavorite,
      config: {
        template: undefined,
        filters: { groups: [{ logic: "AND", rules: filterRules }] },
        // Add some placeholder tiles; you'll wire RPCs later
        tiles: [
          { id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-kpi1`), type: "kpi", title: "Avg Satisfaction", query: { metric: "avg_satisfaction" } },
          { id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-tbl1`), type: "table", title: "Projects", query: { table: "projects" } },
        ],
        layout: [],
      },
    };

    // TS workaround until you regenerate Supabase types for saved_dashboards
    const sb: any = supabase;

    const { data, error } = await sb
      .from("saved_dashboards")
      .insert({ owner_user_id: user.id, ...payload })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Saved", description: "Dashboard created." });
    nav(`/dashboards/${data.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Custom Dashboard Builder</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Checkbox id="fav" checked={isFavorite} onCheckedChange={(v) => setIsFavorite(Boolean(v))} />
            <Label htmlFor="fav" className="flex items-center gap-1 cursor-pointer">
              <Star className="w-4 h-4" /> Favorite
            </Label>
          </div>
          <Button onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Wick — Sales Overview" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger id="visibility"><SelectValue placeholder="Select visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="org">Org</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional context for this dashboard…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Filter (MVP)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <Label>Field</Label>
            <Select value={filterField} onValueChange={setFilterField}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input value={filterValue} onChange={(e) => setFilterValue(e.target.value)} placeholder='e.g. "John Wick" or "Thomas Anderson"' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
