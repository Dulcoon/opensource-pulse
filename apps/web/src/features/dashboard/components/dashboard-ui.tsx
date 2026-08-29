import type { ReactNode } from "react";

export function Panel({ children, className = "", title, code, action }: { children: ReactNode; className?: string; title?: string; code?: string; action?: ReactNode }) {
  return (
    <div className={`rounded-sm border border-border bg-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 h-9 border-b border-border">
          <div className="flex items-center gap-2">
            {code && <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-accent">{code}</span>}
            <h3 className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground">{title}</h3>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function ReportLine({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: "warn" | "success" }) {
  const color = accent ? "text-accent" : tone === "warn" ? "text-warning" : tone === "success" ? "text-success" : "text-muted-foreground";
  return (
    <div>
      <div className={`text-[9px] font-mono uppercase tracking-[0.18em] ${color}`}>{label}</div>
      <p className="mt-1 text-[12.5px] text-foreground/90 leading-relaxed">{value}</p>
    </div>
  );
}

export const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};
