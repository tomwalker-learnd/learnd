import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export function DashboardSwitcher() {
  const nav = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("saved_dashboards")
        .select("id,name")
        .eq("is_favorite", true)
        .order("updated_at", { ascending: false })
        .limit(10);
      setFavorites(data || []);
    })();
  }, []);

  return (
    <Select onValueChange={(val)=> nav(`/dashboards/${val}`)}>
      <SelectTrigger className="w-64"><SelectValue placeholder="Open favorite dashboard…" /></SelectTrigger>
      <SelectContent>
        {favorites.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
