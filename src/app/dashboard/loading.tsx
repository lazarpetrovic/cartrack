import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="h-4 w-24 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <Card className="h-56 animate-pulse bg-muted/40" />
        <div className="space-y-3">
          <Card className="h-28 animate-pulse bg-muted/40" />
          <Card className="h-28 animate-pulse bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

