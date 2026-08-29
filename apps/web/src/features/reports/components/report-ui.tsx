export function ReportFact({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: "success" }) {
  const color = accent ? "text-accent" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-sm border border-border bg-background/40 p-3">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-base font-medium ${color}`}>{value}</div>
    </div>
  );
}
