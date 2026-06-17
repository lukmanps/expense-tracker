import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="flex-1">
        {children}
      </CardContent>
    </Card>
  );
}
