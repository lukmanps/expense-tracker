import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, sub, icon: Icon, colorClass, bgClass }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {label}
        </CardTitle>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", bgClass || "bg-muted")}>
            <Icon className={cn("h-4 w-4", colorClass || "text-muted-foreground")} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
