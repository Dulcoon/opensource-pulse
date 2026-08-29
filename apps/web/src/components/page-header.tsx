import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border px-4 md:px-8 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent mb-1.5">{eyebrow}</div>
          )}
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
