import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutGrid,
  ListFilter,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { VelocityScoreExplainer } from "@/components/velocity-score-explainer";

export interface TechItem {
  id?: number;
  name: string;
  weight: number;
  growth: number;
  status: "Exploding" | "Rising" | "Stable" | "Declining";
  repoCount?: number;
  category?: string;
}

interface TechMatrixProps {
  items: TechItem[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
}

export const SECTORS = [
  { id: "all", label: "All Sectors" },
  { id: "ai", label: "AI & Agents" },
  { id: "devtools", label: "DevTools" },
  { id: "infra", label: "Infra & Cloud" },
  { id: "web", label: "Web Frameworks" },
];

const DEFAULT_COLLAPSED_COUNT = 8;

export function TechMatrix({ items, selectedSector, onSelectSector }: TechMatrixProps) {
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
  const [expanded, setExpanded] = useState(false);

  // Filter items based on sector if categorized
  const filteredItems = items.filter((item) => {
    if (selectedSector === "all") return true;
    const lower = (item.name + " " + (item.category || "")).toLowerCase();
    if (selectedSector === "ai") {
      return (
        lower.includes("ai") ||
        lower.includes("agent") ||
        lower.includes("llm") ||
        lower.includes("gpt") ||
        lower.includes("model") ||
        lower.includes("transformer") ||
        lower.includes("neural")
      );
    }
    if (selectedSector === "devtools") {
      return (
        lower.includes("tool") ||
        lower.includes("cli") ||
        lower.includes("git") ||
        lower.includes("test") ||
        lower.includes("lint") ||
        lower.includes("build")
      );
    }
    if (selectedSector === "infra") {
      return (
        lower.includes("docker") ||
        lower.includes("k8s") ||
        lower.includes("cloud") ||
        lower.includes("db") ||
        lower.includes("postgres") ||
        lower.includes("redis") ||
        lower.includes("server")
      );
    }
    if (selectedSector === "web") {
      return (
        lower.includes("react") ||
        lower.includes("vue") ||
        lower.includes("next") ||
        lower.includes("svelte") ||
        lower.includes("ui") ||
        lower.includes("css") ||
        lower.includes("html")
      );
    }
    return true;
  });

  const displayList = filteredItems.length > 0 ? filteredItems : items;
  const hasMore = displayList.length > DEFAULT_COLLAPSED_COUNT;
  const visibleItems = expanded || !hasMore ? displayList : displayList.slice(0, DEFAULT_COLLAPSED_COUNT);

  return (
    <div className="space-y-3">
      {/* Top Filter & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2.5">
        {/* Sector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
          <Layers className="h-3 w-3 text-muted-foreground mr-1" />
          {SECTORS.map((s) => {
            const active = selectedSector === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  onSelectSector(s.id);
                  setExpanded(false);
                }}
                className={`px-2.5 py-1 rounded-sm transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* View Switcher: Matrix Grid vs List */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
            Showing <strong className="text-foreground">{visibleItems.length}</strong> of {displayList.length}
          </span>
          <div className="flex items-center gap-1 bg-background/80 border border-border p-0.5 rounded-sm">
            <button
              onClick={() => setViewMode("matrix")}
              title="Matrix Grid View"
              className={`p-1 rounded-xs transition-colors cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Detailed List View"
              className={`p-1 rounded-xs transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
            </button>
          </div>

          <VelocityScoreExplainer
            trigger={
              <button
                type="button"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-accent cursor-pointer transition-colors px-1.5 py-1 rounded-sm border border-border/80 hover:border-accent/40 bg-card/60"
                title="View Velocity Score Calculation Formula"
              >
                <span>Formula</span>
                <HelpCircle className="h-2.5 w-2.5 text-accent" />
              </button>
            }
            align="end"
          />
        </div>
      </div>

      {/* MATRIX VIEW */}
      {viewMode === "matrix" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {visibleItems.map((t) => {
            const isExploding = t.status === "Exploding";
            const isRising = t.status === "Rising";
            const isDeclining = t.status === "Declining";

            const borderGlow = isExploding
              ? "border-emerald-500/40 hover:border-emerald-500 hover:shadow-emerald-950/20"
              : isRising
                ? "border-sky-500/40 hover:border-sky-500 hover:shadow-sky-950/20"
                : isDeclining
                  ? "border-rose-500/40 hover:border-rose-500"
                  : "border-border hover:border-accent/60";

            const statusDot = isExploding
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              : isRising
                ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                : isDeclining
                  ? "bg-rose-400"
                  : "bg-amber-400";

            const growthColor = t.growth >= 0 ? "text-emerald-400" : "text-rose-400";

            return (
              <Link
                key={t.name}
                to="/radar"
                className={`group relative flex flex-col justify-between p-3 rounded-sm border bg-card/60 hover:bg-card hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all duration-150 cursor-pointer ${borderGlow}`}
              >
                {/* Header: Status Dot + Growth Badge */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot}`} />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground truncate">
                      {t.status}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-medium ${growthColor} flex items-center shrink-0`}>
                    {t.growth >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                    {t.growth >= 0 ? "+" : ""}
                    {t.growth}%
                  </span>
                </div>

                {/* Tech Name */}
                <div className="mt-2.5">
                  <div className="text-[13px] font-semibold text-foreground tracking-tight group-hover:text-accent transition-colors truncate">
                    {t.name}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {t.repoCount ? `${t.repoCount} repos` : "Active sector"}
                  </div>
                </div>

                {/* Footer Score Bar */}
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                  <div className="h-1 flex-1 bg-background/90 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${
                        isExploding ? "bg-emerald-400" : isRising ? "bg-sky-400" : "bg-accent"
                      }`}
                      style={{ width: `${Math.min(t.weight, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground tabular shrink-0">
                    {t.weight} pts
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* DETAILED LIST VIEW */
        <div className="divide-y divide-border/60 rounded-sm border border-border bg-card/40">
          {visibleItems.map((h) => {
            const barColor =
              h.status === "Exploding"
                ? "bg-emerald-500"
                : h.status === "Rising"
                  ? "bg-sky-500"
                  : h.status === "Stable"
                    ? "bg-amber-500"
                    : "bg-rose-500";
            return (
              <Link
                key={h.name}
                to="/radar"
                className="group grid grid-cols-12 items-center gap-3 px-3 py-2 hover:bg-card/80 transition-colors cursor-pointer"
              >
                <div className="col-span-4 md:col-span-3 text-[12px] font-mono font-medium text-foreground group-hover:text-accent truncate flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {h.name}
                </div>
                <div className="col-span-6 md:col-span-7">
                  <div className="h-4.5 w-full rounded-xs bg-background/80 border border-border/80 overflow-hidden relative">
                    <div
                      className={`h-full ${barColor} opacity-90 transition-all duration-300`}
                      style={{ width: `${h.weight}%` }}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center text-[10px] font-mono text-foreground font-medium">
                      {h.weight}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-2 text-right text-[11px] font-mono">
                  <span className={h.growth >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                    {h.growth >= 0 ? "+" : ""}
                    {h.growth}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* EXPAND / COLLAPSE ACTION STRIP */}
      {hasMore && (
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 px-3 rounded-sm border border-dashed border-border/80 hover:border-accent/60 bg-background/40 hover:bg-card text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {expanded ? (
              <>
                <span>Collapse to Top {DEFAULT_COLLAPSED_COUNT}</span>
                <ChevronUp className="h-3.5 w-3.5 text-accent" />
              </>
            ) : (
              <>
                <span>Show All {displayList.length} Technologies ({displayList.length - DEFAULT_COLLAPSED_COUNT} More)</span>
                <ChevronDown className="h-3.5 w-3.5 text-accent" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
