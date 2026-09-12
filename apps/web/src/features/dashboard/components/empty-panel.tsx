import { Link } from "@tanstack/react-router";
import { DatabaseZap } from "lucide-react";

interface EmptyPanelProps {
  title?: string;
  message?: string;
  hint?: string;
  actionLabel?: string;
}

/**
 * Honest empty state used instead of mock fallbacks: tells the visitor the
 * data is not there yet and where to trigger the first sync.
 */
export function EmptyPanel({
  title = "Awaiting first sync",
  message = "No data has been ingested yet. Run a sync to populate this panel.",
  hint = "Syncs run automatically every 6 hours once configured.",
  actionLabel = "Open Admin",
}: EmptyPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background">
        <DatabaseZap className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground">
        {title}
      </div>
      <p className="max-w-sm text-[12px] leading-relaxed text-muted-foreground">{message}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {hint}
      </p>
      <Link
        to="/admin"
        className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90"
      >
        {actionLabel} →
      </Link>
    </div>
  );
}
