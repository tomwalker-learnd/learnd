import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Builder() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Custom Dashboard Builder</h1>
      <Card>
        <CardHeader><CardTitle>Coming soon</CardTitle></CardHeader>
        <CardContent>
          Use this screen to compose filters, choose tiles, and save to favorites.
        </CardContent>
      </Card>
    </div>
  );
}

