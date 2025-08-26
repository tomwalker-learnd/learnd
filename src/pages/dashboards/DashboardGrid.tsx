import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Tile = { id: string; type: "kpi"|"line"|"bar"|"pie"|"table"|"scatter"; title: string; query?: any; props?: Record<string, any> };

const KpiTile = ({ title, value }: any) => (
  <Card className="rounded-2xl shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
    <CardContent><div className="text-3xl font-semibold">{value ?? "—"}</div></CardContent>
  </Card>
);

const PlaceholderChart = ({ title }: any) => (
  <Card className="rounded-2xl shadow-sm h-64 flex flex-col">
    <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
    <CardContent className="text-sm text-muted-foreground">Chart preview (wire to Recharts)</CardContent>
  </Card>
);

const ProjectsTable = () => (
  <Card className="rounded-2xl shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="text-base">Projects</CardTitle></CardHeader>
    <CardContent className="text-sm text-muted-foreground">Table preview (sortable)</CardContent>
  </Card>
);

export function DashboardGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tiles.map((t) => {
        if (t.type === "kpi") return <KpiTile key={t.id} title={t.title} value={null} />;
        if (t.type === "table") return <ProjectsTable key={t.id} />;
        return <PlaceholderChart key={t.id} title={t.title} />;
      })}
    </div>
  );
}

