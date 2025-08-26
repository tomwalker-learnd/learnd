import { Link } from "react-router-dom";

export default function SavedList() {
  return (
    <div className="p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Dashboards</h1>
        <Link to="/dashboards/builder" className="underline">
          New dashboard
        </Link>
      </div>
      <p className="text-muted-foreground">No saved dashboards yet.</p>
    </div>
  );
}
