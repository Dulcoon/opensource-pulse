import type { RadarStatus } from "@/lib/mock-data";

const map: Record<RadarStatus, string> = {
  Exploding:  "bg-accent/10 text-accent border-accent/40",
  Rising:     "bg-success/10 text-success border-success/30",
  Stable:     "bg-signal/10 text-signal border-signal/30",
  Declining:  "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: RadarStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
}
