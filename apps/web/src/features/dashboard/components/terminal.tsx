import { Zap, AlertTriangle, FileText, Activity, TrendingUp, TrendingDown } from "lucide-react";

export type FeedKind = "signal" | "alert" | "report" | "movement";

export function feedIcon(kind: FeedKind) {
  switch (kind) {
    case "signal":   return { Icon: Zap,           color: "text-accent" };
    case "alert":    return { Icon: AlertTriangle, color: "text-warning" };
    case "report":   return { Icon: FileText,      color: "text-signal" };
    case "movement": return { Icon: Activity,      color: "text-success" };
  }
}

export function Metric({ label, value, tone }: { label: string; value: string; tone: "up" | "down" | "neutral" | "accent" }) {
  const color =
    tone === "up" ? "text-success" :
    tone === "down" ? "text-destructive" :
    tone === "accent" ? "text-accent" :
    "text-foreground";
  return (
    <div className="rounded-sm border border-border bg-background/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-[13px] font-medium tabular ${color}`}>
        {tone === "up" && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
        {tone === "down" && <TrendingDown className="inline h-3 w-3 mr-0.5" />}
        {value}
      </div>
    </div>
  );
}
