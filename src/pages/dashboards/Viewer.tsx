import { useParams } from "react-router-dom";
export default function Viewer() {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard {id}</h1>
      <p className="text-muted-foreground">Viewer stub — replace with real tiles later.</p>
    </div>
  );
}
