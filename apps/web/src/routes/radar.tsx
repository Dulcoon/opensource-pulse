import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Flame,
  TrendingUp,
  Minus,
  TrendingDown,
  Search,
  ExternalLink,
  Target,
  Layers,
  Sparkles,
  Info,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { VelocityScoreExplainer } from "@/components/velocity-score-explainer";
import { useRadar } from "@/hooks/use-radar";
import type { TechnologyScore } from "@/types/api";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Tech Radar — OpenSource Pulse" },
      {
        name: "description",
        content: "Interactive intelligence radar mapping open-source technology momentum across 4 empirical quadrants.",
      },
    ],
  }),
  component: RadarPage,
});

type QuadrantType = "Exploding" | "Rising" | "Stable" | "Declining";

interface RadarItem {
  id: number;
  techId: number;
  name: string;
  slug: string;
  quadrant: QuadrantType;
  score: number;
  growth: number;
  repos: number;
  rank: number;
  // Calculated geometric coordinates
  x: number;
  y: number;
  r: number;
  angleDeg: number;
}

const QUADRANT_CONFIG: Record<
  QuadrantType,
  {
    label: string;
    description: string;
    color: string;
    dotColor: string;
    badgeStyle: string;
    ringColor: string;
    Icon: typeof Flame;
    startAngle: number; // degrees
    endAngle: number;
  }
> = {
  Exploding: {
    label: "Exploding",
    description: "Breakout velocity (>70 score & >15% surge)",
    color: "#10B981", // emerald
    dotColor: "#34D399",
    badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    ringColor: "rgba(16, 185, 129, 0.2)",
    Icon: Flame,
    startAngle: 275, // Top-Right quadrant
    endAngle: 355,
  },
  Rising: {
    label: "Rising",
    description: "Strong steady momentum (>45 score)",
    color: "#38BDF8", // sky blue
    dotColor: "#60A5FA",
    badgeStyle: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    ringColor: "rgba(56, 189, 248, 0.2)",
    Icon: TrendingUp,
    startAngle: 185, // Top-Left quadrant
    endAngle: 265,
  },
  Stable: {
    label: "Stable",
    description: "Established core ecosystem standards",
    color: "#F59E0B", // amber
    dotColor: "#FBBF24",
    badgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    ringColor: "rgba(245, 158, 11, 0.2)",
    Icon: Minus,
    startAngle: 95, // Bottom-Left quadrant
    endAngle: 175,
  },
  Declining: {
    label: "Declining",
    description: "Slowing adoption or legacy migration",
    color: "#94A3B8", // slate
    dotColor: "#CBD5E1",
    badgeStyle: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    ringColor: "rgba(148, 163, 184, 0.2)",
    Icon: TrendingDown,
    startAngle: 5, // Bottom-Right quadrant
    endAngle: 85,
  },
};

const QUADRANT_METHODOLOGY = [
  {
    type: "Exploding" as QuadrantType,
    title: "Exploding",
    tagline: "Breakout Surge",
    criteria: "Score > 70 & Velocity > +15%",
    color: "#10B981",
    borderClass: "border-emerald-500/40 hover:border-emerald-500 hover:shadow-emerald-950/20",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Icon: Flame,
    definition:
      "Nascent or breakout technologies experiencing exponential developer adoption over the trailing 7 days. Characterized by explosive fork velocity and surging contributor influx.",
    action: "Investigate immediately. Prime candidates for securing an early-mover architectural advantage.",
  },
  {
    type: "Rising" as QuadrantType,
    title: "Rising",
    tagline: "High Velocity",
    criteria: "Score 45–70 & Positive Growth",
    color: "#38BDF8",
    borderClass: "border-sky-500/40 hover:border-sky-500 hover:shadow-sky-950/20",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    Icon: TrendingUp,
    definition:
      "Technologies exhibiting steady, dependable upward momentum. Field-proven reliability with expanding production adoption across enterprise engineering stacks.",
    action: "Strong adoption candidate. Evaluate for inclusion in upcoming architecture cycles and production roadmaps.",
  },
  {
    type: "Stable" as QuadrantType,
    title: "Stable",
    tagline: "Ecosystem Pillar",
    criteria: "Mature Standard (0–15% Velocity)",
    color: "#F59E0B",
    borderClass: "border-amber-500/40 hover:border-amber-500 hover:shadow-amber-950/20",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Icon: Minus,
    definition:
      "Battle-tested de-facto industry standards. Substantial cumulative star volume with plateaued velocity due to broad market penetration and mature maintenance.",
    action: "Retain & maintain. Highly dependable production bedrock without pressing urgency for re-platforming.",
  },
  {
    type: "Declining" as QuadrantType,
    title: "Declining",
    tagline: "Migration Phase",
    criteria: "Negative Delta / Stagnant Activity",
    color: "#94A3B8",
    borderClass: "border-slate-500/40 hover:border-slate-400 hover:shadow-slate-950/20",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    Icon: TrendingDown,
    definition:
      "Technologies losing active developer mindshare due to infrequent releases, legacy status, or community migration toward superior modern paradigms.",
    action: "Assess technical debt. Monitor dependencies and scaffold migration plans toward active alternatives.",
  },
];

function RadarPage() {
  const { data: scores, isLoading } = useRadar();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [activeQuadrantFilter, setActiveQuadrantFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Process raw data into geometrically distributed radar coordinates
  const radarItems = useMemo<RadarItem[]>(() => {
    if (!scores || scores.length === 0) return [];

    // Sort scores descending by score
    const sorted = [...scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    // Group items by quadrant to calculate collision-free angles
    const groups: Record<QuadrantType, TechnologyScore[]> = {
      Exploding: [],
      Rising: [],
      Stable: [],
      Declining: [],
    };

    sorted.forEach((s) => {
      const q = (s.status || "Stable") as QuadrantType;
      if (groups[q]) {
        groups[q].push(s);
      } else {
        groups.Stable.push(s);
      }
    });

    const CX = 250;
    const CY = 250;
    const MIN_R = 40; // Bullseye
    const MAX_R = 215; // Outer boundary

    const results: RadarItem[] = [];

    // Map each quadrant with spatial awareness
    (Object.keys(groups) as QuadrantType[]).forEach((q) => {
      const list = groups[q];
      const cfg = QUADRANT_CONFIG[q];
      const count = list.length;
      if (count === 0) return;

      const angleSpan = cfg.endAngle - cfg.startAngle;

      list.forEach((item, idx) => {
        const score = Math.max(0, Math.min(100, item.score ?? 0));
        // High score = closer to center (Bullseye)
        const radius = MIN_R + ((100 - score) / 100) * (MAX_R - MIN_R);

        // Spread angle across the quadrant with slight deterministic offset
        const angleStep = count > 1 ? angleSpan / (count + 1) : angleSpan / 2;
        const baseAngle = cfg.startAngle + angleStep * (idx + 1);
        // Small pseudo-random jitter based on ID to avoid artificial arcs
        const jitter = (((item.technology_id * 17) % 11) - 5) * 1.5;
        const angleDeg = baseAngle + jitter;
        const angleRad = (angleDeg * Math.PI) / 180;

        const x = Math.round((CX + radius * Math.cos(angleRad)) * 10) / 10;
        const y = Math.round((CY + radius * Math.sin(angleRad)) * 10) / 10;

        const globalRank = sorted.findIndex((s) => s.id === item.id) + 1;

        results.push({
          id: item.id,
          techId: item.technology_id,
          name: item.technology?.technology_name || `Tech #${item.technology_id}`,
          slug: item.technology?.slug || `tech-${item.technology_id}`,
          quadrant: q,
          score: Math.round((item.score ?? 0) * 10) / 10,
          growth: Math.round((item.growth_percentage ?? 0) * 100) / 100,
          repos: item.repository_count ?? 0,
          rank: globalRank,
          x,
          y,
          r: radius,
          angleDeg,
        });
      });
    });

    return results;
  }, [scores]);

  // Filter items for the list and visual emphasis
  const filteredItems = useMemo(() => {
    return radarItems.filter((item) => {
      if (activeQuadrantFilter !== "all" && item.quadrant.toLowerCase() !== activeQuadrantFilter) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
      }
      return true;
    });
  }, [radarItems, activeQuadrantFilter, searchFilter]);

  // Selected item (defaults to highest-ranked item)
  const activeItem = useMemo(() => {
    if (selectedSlug) {
      const found = radarItems.find((t) => t.slug === selectedSlug);
      if (found) return found;
    }
    return radarItems[0] || null;
  }, [radarItems, selectedSlug]);

  // Currently focused item (either hovered or selected)
  const focusedSlug = hoveredSlug || selectedSlug || activeItem?.slug;

  if (isLoading) {
    return (
      <>
        <PageHeader
          eyebrow="ECOSYSTEM INTELLIGENCE"
          title="Tech Radar"
          description="Synthesizing empirical adoption velocity and market signals..."
        />
        <div className="px-4 md:px-8 py-16 text-center text-[12px] font-mono text-muted-foreground">
          Calibrating radar coordinates from repository telemetry...
        </div>
      </>
    );
  }

  if (radarItems.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="ECOSYSTEM INTELLIGENCE"
          title="Tech Radar"
          description="Synthesizing empirical adoption velocity and market signals."
        />
        <div className="px-4 md:px-8 py-16 text-center text-[12px] font-mono text-muted-foreground border border-dashed border-border m-8 rounded-sm">
          No technology scores available yet. Trigger recalculation from the Admin console.
        </div>
      </>
    );
  }

  // Identify Top 6 Viral Leaders for prominent leader-line labels
  const topLeaders = radarItems.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="RADIAL MOMENTUM ENGINE"
        title="Tech Radar"
        description="Empirical 4-quadrant momentum map. Proximity to the glowing core indicates exponential velocity."
      />

      <div className="px-4 md:px-8 py-5 space-y-4">
        {/* RADAR TOOLBAR & FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-card p-2.5">
          {/* Quadrant filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
            <span className="text-muted-foreground mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3" /> Quadrant:
            </span>
            <button
              onClick={() => setActiveQuadrantFilter("all")}
              className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                activeQuadrantFilter === "all"
                  ? "bg-foreground text-background font-semibold"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border/80"
              }`}
            >
              All ({radarItems.length})
            </button>
            {(["Exploding", "Rising", "Stable", "Declining"] as QuadrantType[]).map((q) => {
              const count = radarItems.filter((i) => i.quadrant === q).length;
              const cfg = QUADRANT_CONFIG[q];
              const active = activeQuadrantFilter === q.toLowerCase();
              return (
                <button
                  key={q}
                  onClick={() => setActiveQuadrantFilter(q.toLowerCase())}
                  className={`px-2.5 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                      : "bg-background text-muted-foreground hover:text-foreground border border-border/80"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {q} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Filter by name or slug…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-8 rounded-xs border border-border bg-background pl-8 pr-3 text-[11px] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* MAIN RADAR VIEWPORT & INSPECTION GRID */}
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* LEFT: THE INTERACTIVE POLAR RADAR (COL 7) */}
          <div className="col-span-12 lg:col-span-7 rounded-sm border border-border bg-card p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Top legend bar */}
            <div className="w-full flex items-center justify-between border-b border-border/60 pb-2 mb-2">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <Target className="h-3 w-3 text-accent" />
                <span>Polar Velocity Scope</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                Inner Core = <span className="text-emerald-400 font-semibold">100 Pts (Breakout)</span>
              </div>
            </div>

            {/* RADAR SVG CANVAS */}
            <div className="relative w-full max-w-[500px] aspect-square select-none">
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full overflow-visible"
                style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }}
              >
                <defs>
                  {/* Glowing Core Radial Gradient */}
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#10B981" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </radialGradient>

                  {/* Subtle Grid Ring Gradient */}
                  <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
                  </radialGradient>
                </defs>

                {/* Background disc */}
                <circle cx="250" cy="250" r="225" fill="url(#radarBg)" />
                <circle cx="250" cy="250" r="70" fill="url(#coreGlow)" />

                {/* CONCENTRIC RADAR RINGS */}
                {[
                  { r: 225, label: "T3 (25 pts)", dash: "0" },
                  { r: 165, label: "T2 (50 pts)", dash: "2 4" },
                  { r: 105, label: "T1 (75 pts)", dash: "2 4" },
                  { r: 45, label: "Core (95+ pts)", dash: "0" },
                ].map((ring) => (
                  <g key={ring.r}>
                    <circle
                      cx="250"
                      cy="250"
                      r={ring.r}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                      strokeDasharray={ring.dash}
                    />
                    <text
                      x="254"
                      y={250 - ring.r + 11}
                      fill="rgba(255, 255, 255, 0.25)"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {ring.label}
                    </text>
                  </g>
                ))}

                {/* CROSSHAIR QUADRANT DIVIDERS */}
                <line
                  x1="250"
                  y1="25"
                  x2="250"
                  y2="475"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <line
                  x1="25"
                  y1="250"
                  x2="475"
                  y2="250"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* QUADRANT CORNER HEADERS (CLEAN & NON-OBTRUSIVE) */}
                <g className="font-mono uppercase tracking-widest text-[9px] font-semibold select-none">
                  {/* Top-Right: EXPLODING */}
                  <text x="440" y="45" textAnchor="end" fill="#10B981">
                    EXPLODING ↗
                  </text>
                  {/* Top-Left: RISING */}
                  <text x="60" y="45" textAnchor="start" fill="#38BDF8">
                    ↖ RISING
                  </text>
                  {/* Bottom-Left: STABLE */}
                  <text x="60" y="465" textAnchor="start" fill="#F59E0B">
                    ↙ STABLE
                  </text>
                  {/* Bottom-Right: DECLINING */}
                  <text x="440" y="465" textAnchor="end" fill="#94A3B8">
                    DECLINING ↘
                  </text>
                </g>

                {/* RADAR BLIPS (DOTS) */}
                {radarItems.map((item) => {
                  const cfg = QUADRANT_CONFIG[item.quadrant];
                  const isHovered = hoveredSlug === item.slug;
                  const isSelected = selectedSlug === item.slug;
                  const isFocused = isHovered || isSelected;

                  // Dim blips that don't match the current filter
                  const matchesFilter =
                    (activeQuadrantFilter === "all" ||
                      item.quadrant.toLowerCase() === activeQuadrantFilter) &&
                    (!searchFilter.trim() ||
                      item.name.toLowerCase().includes(searchFilter.toLowerCase().trim()));

                  const opacity = matchesFilter ? (isFocused ? 1 : 0.8) : 0.15;
                  const isTopLeader = topLeaders.some((l) => l.slug === item.slug);

                  return (
                    <g
                      key={item.slug}
                      onClick={() => setSelectedSlug(item.slug)}
                      onMouseEnter={() => setHoveredSlug(item.slug)}
                      onMouseLeave={() => setHoveredSlug(null)}
                      className="cursor-pointer transition-transform duration-150"
                    >
                      {/* Subtle selection halo for focused or active item */}
                      {isFocused && (
                        <circle
                          cx={item.x}
                          cy={item.y}
                          r="12"
                          fill="none"
                          stroke={cfg.color}
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                      )}

                      {/* Main Blip Circle */}
                      <circle
                        cx={item.x}
                        cy={item.y}
                        r={isFocused ? 7 : isTopLeader ? 5.5 : 4}
                        fill={cfg.dotColor}
                        opacity={opacity}
                        stroke={isFocused ? "#FFFFFF" : "rgba(0,0,0,0.8)"}
                        strokeWidth={isFocused ? 2 : 1}
                        style={{
                          filter: isFocused
                            ? `drop-shadow(0 0 8px ${cfg.color})`
                            : undefined,
                        }}
                      />

                      {/* Callout Label for Top Leaders or Hovered Item */}
                      {(isTopLeader || isFocused) && matchesFilter && (
                        <g>
                          <rect
                            x={item.x > 250 ? item.x + 8 : item.x - 70}
                            y={item.y - 10}
                            width="62"
                            height="18"
                            rx="2"
                            fill="rgba(10, 10, 10, 0.85)"
                            stroke={isFocused ? cfg.color : "rgba(255, 255, 255, 0.2)"}
                            strokeWidth={isFocused ? 1.5 : 0.8}
                          />
                          <text
                            x={item.x > 250 ? item.x + 12 : item.x - 66}
                            y={item.y + 2}
                            fill={isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)"}
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight={isFocused ? "bold" : "normal"}
                          >
                            {item.name.length > 8 ? item.name.slice(0, 8) + "…" : item.name}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom coordinate readout */}
            <div className="w-full flex items-center justify-between border-t border-border/60 pt-2 mt-2 text-[10px] font-mono text-muted-foreground">
              <span>ACTIVE BLIPS: {radarItems.length}</span>
              {hoveredSlug ? (
                <span className="text-foreground">
                  HOVERED: <strong className="text-accent">{hoveredSlug}</strong>
                </span>
              ) : (
                <span>HOVER ANY BLIP TO INSPECT</span>
              )}
            </div>
          </div>

          {/* RIGHT: INSPECTION PANEL & FULL RANKINGS LEDGER (COL 5) */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* ACTIVE TELEMETRY CARD */}
            {activeItem && (
              <div className="rounded-sm border border-border bg-card p-4 space-y-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                          QUADRANT_CONFIG[activeItem.quadrant].badgeStyle
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: QUADRANT_CONFIG[activeItem.quadrant].color }}
                        />
                        {activeItem.quadrant}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Ecosystem Rank #{activeItem.rank}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-1 tracking-tight">
                      {activeItem.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <VelocityScoreExplainer score={activeItem.score} align="end" />
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                      {activeItem.score}
                      <span className="text-[11px] font-normal text-muted-foreground ml-0.5">/100</span>
                    </div>
                  </div>
                </div>

                {/* 3 Telemetry Pillars */}
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="rounded-xs border border-border/80 bg-background/50 p-2 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      7D Momentum
                    </span>
                    <span
                      className={`mt-0.5 font-bold tabular ${
                        activeItem.growth >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {activeItem.growth >= 0 ? "+" : ""}
                      {activeItem.growth}%
                    </span>
                  </div>

                  <div className="rounded-xs border border-border/80 bg-background/50 p-2 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Adoption
                    </span>
                    <span className="mt-0.5 font-semibold text-foreground tabular">
                      {activeItem.repos} {activeItem.repos === 1 ? "repo" : "repos"}
                    </span>
                  </div>

                  <div className="rounded-xs border border-border/80 bg-background/50 p-2 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Status Tier
                    </span>
                    <span className="mt-0.5 font-semibold text-foreground capitalize truncate">
                      {activeItem.quadrant}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Empirical data from GitHub snapshots
                  </span>
                  <Link
                    to="/repositories"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline cursor-pointer"
                  >
                    <span>View Repos</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* FULL TECHNOLOGY RANKINGS LEDGER */}
            <div className="rounded-sm border border-border bg-card overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Technology Rankings
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Showing {filteredItems.length} items
                </span>
              </div>

              {/* High-density scrollable table */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground bg-background/60 sticky top-0 border-b border-border/80">
                      <th className="text-left px-3 py-2 font-medium w-10">#</th>
                      <th className="text-left px-3 py-2 font-medium">Technology</th>
                      <th className="text-left px-2 py-2 font-medium">Quadrant</th>
                      <th className="text-right px-2 py-2 font-medium">
                        <VelocityScoreExplainer
                          trigger={
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer group ml-auto"
                              title="Click to view Velocity Score formula"
                            >
                              <span>Score</span>
                              <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/70 group-hover:text-accent" />
                            </button>
                          }
                          align="end"
                        />
                      </th>
                      <th className="text-right px-3 py-2 font-medium">7D Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {filteredItems.map((item) => {
                      const cfg = QUADRANT_CONFIG[item.quadrant];
                      const isFocused = focusedSlug === item.slug;

                      return (
                        <tr
                          key={item.slug}
                          onClick={() => setSelectedSlug(item.slug)}
                          onMouseEnter={() => setHoveredSlug(item.slug)}
                          onMouseLeave={() => setHoveredSlug(null)}
                          className={`cursor-pointer transition-colors duration-100 ${
                            isFocused
                              ? "bg-accent/10 text-foreground font-semibold"
                              : "hover:bg-card/90 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <td className="px-3 py-2 text-[10px] text-muted-foreground">
                            #{item.rank}
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground truncate max-w-[130px]">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: cfg.color }}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-[10px]">
                            <span
                              className="capitalize"
                              style={{ color: cfg.color }}
                            >
                              {item.quadrant}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right tabular text-foreground font-semibold">
                            {item.score}
                          </td>
                          <td className="px-3 py-2 text-right tabular">
                            <span
                              className={
                                item.growth >= 0 ? "text-emerald-400" : "text-rose-400"
                              }
                            >
                              {item.growth >= 0 ? "+" : ""}
                              {item.growth}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* QUADRANT METHODOLOGY & INTELLIGENCE GLOSSARY */}
        <div className="rounded-sm border border-border bg-card p-4 md:p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <span>Quadrant Telemetry Methodology</span>
                  <span className="text-[9px] font-mono font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-xs border border-border">
                    Intelligence Taxonomy
                  </span>
                </h2>
                <p className="text-[11px] font-mono text-muted-foreground">
                  Algorithmic momentum taxonomy calibrated from 7-day velocity deltas and market adoption scores.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground shrink-0">
              <span className="text-accent font-semibold uppercase tracking-wider">Tip:</span> Click any card to filter the radar view above
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {QUADRANT_METHODOLOGY.map((m) => {
              const IconComponent = m.Icon;
              const isSelected = activeQuadrantFilter === m.type;
              const count = radarItems.filter((i) => i.quadrant === m.type).length;

              return (
                <div
                  key={m.type}
                  onClick={() => {
                    setActiveQuadrantFilter(isSelected ? "all" : m.type);
                    window.scrollTo({ top: 180, behavior: "smooth" });
                  }}
                  className={`group rounded-sm border p-3.5 flex flex-col justify-between transition-all duration-150 cursor-pointer bg-background/50 hover:bg-background ${
                    isSelected
                      ? "border-accent ring-1 ring-accent/50 bg-accent/5 shadow-sm"
                      : `${m.borderClass} hover:-translate-y-0.5 hover:shadow-md`
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Badge + Counter */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider font-semibold border ${m.badgeClass}`}
                      >
                        <IconComponent className="h-2.5 w-2.5" />
                        <span>{m.title}</span>
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        <strong className="text-foreground font-semibold">{count}</strong> assets
                      </span>
                    </div>

                    {/* Criteria Formula Tag */}
                    <div className="text-[10px] font-mono text-muted-foreground/90 bg-card px-2 py-1 rounded-xs border border-border/60">
                      Formula: <span className="text-foreground font-medium">{m.criteria}</span>
                    </div>

                    {/* Definition */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {m.definition}
                    </p>
                  </div>

                  {/* Strategic Directive Action */}
                  <div className="mt-3 pt-2.5 border-t border-border/50 text-[10px] font-mono">
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                      Strategic Directive:
                    </span>
                    <span className="text-foreground/90 leading-tight block mt-1">
                      {m.action}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
