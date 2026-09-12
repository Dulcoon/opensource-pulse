import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useDashboard } from "@/hooks/use-dashboard";
import { Panel, fade } from "@/features/dashboard/components/dashboard-ui";
import { feedIcon, type FeedKind } from "@/features/dashboard/components/terminal";
import { TechMatrix, type TechItem } from "@/features/dashboard/components/tech-matrix";
import { EmptyPanel } from "@/features/dashboard/components/empty-panel";
import { ClientDate } from "@/lib/client-only";
import { isStaleData, timeAgo } from "@/lib/time-ago";
import type { DashboardRange, FastestGrowingRepo, TechnologyScore } from "@/types/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminal — OpenSource Pulse" },
      {
        name: "description",
        content:
          "The Bloomberg terminal for open source. Real-time intelligence on repositories, technologies, and emerging signals.",
      },
    ],
  }),
  component: Dashboard,
});

const TIMEFRAMES = [
  { label: "24H", range: "24h" },
  { label: "7D", range: "7d" },
  { label: "30D", range: "30d" },
] as const;

type TimeframeLabel = (typeof TIMEFRAMES)[number]["label"];

const RANGE_OF: Record<TimeframeLabel, DashboardRange> = {
  "24H": "24h",
  "7D": "7d",
  "30D": "30d",
};

interface LiveEvent {
  time: string;
  kind: FeedKind;
  tag: string;
  text: string;
}

function mapStatus(status: string | null | undefined): TechItem["status"] {
  return status === "Exploding" ||
    status === "Rising" ||
    status === "Stable" ||
    status === "Declining"
    ? status
    : "Stable";
}

function toTechItems(scores: TechnologyScore[] | undefined): TechItem[] {
  if (!scores) return [];
  return scores.map((t) => ({
    id: t.technology_id,
    name: t.technology?.technology_name || `Tech #${t.technology_id}`,
    weight: Math.min(Math.round((t.score ?? 0) * 10), 100),
    growth: Math.round(t.growth_percentage ?? 0),
    status: mapStatus(t.status),
    repoCount: t.repository_count ?? undefined,
    category: t.technology?.category ?? undefined,
  }));
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-sm border border-border/80 bg-background/50 p-3.5 flex flex-col justify-between group hover:border-accent/50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular text-foreground">
        {value}
      </div>
      <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {sub}
      </div>
    </div>
  );
}

function Dashboard() {
  const [timeframe, setTimeframe] = useState<TimeframeLabel>("7D");
  const range = RANGE_OF[timeframe];
  const { data: dash, isLoading, isError } = useDashboard(range);
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const stats = dash?.weekly_statistics ?? null;
  const heatmap = useMemo(() => toTechItems(dash?.hot_technologies), [dash]);
  const topMovers: FastestGrowingRepo[] = useMemo(() => {
    if (dash?.fastest_growing_repos && dash.fastest_growing_repos.length > 0) {
      return dash.fastest_growing_repos;
    }
    return dash?.fastest_growing_repo ? [dash.fastest_growing_repo] : [];
  }, [dash]);

  const insightText = dash?.weekly_insight?.insight_text ?? "";
  const dataAsOf = dash?.meta?.data_as_of ?? dash?.weekly_insight?.generated_at ?? null;
  const updatedLabel = timeAgo(dataAsOf);
  const stale = isStaleData(dataAsOf);
  const hasAnyData =
    heatmap.length > 0 ||
    topMovers.length > 0 ||
    insightText !== "" ||
    (stats?.total_repos ?? 0) > 0;

  const statusDot = isError
    ? "bg-destructive"
    : isLoading
      ? "bg-warning"
      : stale
        ? "bg-warning"
        : "bg-emerald-400";
  const statusText = isError
    ? "OFFLINE"
    : isLoading
      ? "LOADING"
      : !hasAnyData
        ? "AWAITING SYNC"
        : stale
          ? `STALE · UPDATED ${updatedLabel?.toUpperCase() ?? "UNKNOWN"}`
          : `SYNCED · UPDATED ${updatedLabel?.toUpperCase() ?? "JUST NOW"}`;

  // Intelligence events derived from live telemetry only — no invented feed.
  const liveEvents: LiveEvent[] = useMemo(() => {
    const events: LiveEvent[] = [];
    if (dash?.hot_technologies && dash.hot_technologies.length > 0) {
      dash.hot_technologies.slice(0, 4).forEach((t, i) => {
        const name = t.technology?.technology_name || `Tech #${t.technology_id}`;
        const growth = Math.round(t.growth_percentage ?? 0);
        events.push({
          time: `R-${i + 1}`,
          kind: growth > 50 ? "signal" : "movement",
          tag: name,
          text: `${name} registered ${growth >= 0 ? "+" : ""}${growth}% velocity over the selected ${range} window.`,
        });
      });
    }
    if (dash?.fastest_growing_repos && dash.fastest_growing_repos.length > 0) {
      dash.fastest_growing_repos.slice(0, 3).forEach((r, i) => {
        events.push({
          time: `M-${i + 1}`,
          kind: "report",
          tag: r.full_name.split("/")[1] || r.full_name,
          text: `${r.full_name} gained +${r.growth.toLocaleString()} stars in the selected ${range} window.`,
        });
      });
    }
    return events;
  }, [dash, range]);

  const dominantCluster = heatmap.length > 0 ? heatmap[0].name : "—";
  const emergingBreakout = dash?.emerging_technologies?.[0]?.technology?.technology_name ?? "—";
  const explodingCount = heatmap.filter((h) => h.status === "Exploding").length;

  const fmt = (n: number | undefined | null) =>
    n === undefined || n === null ? "—" : n.toLocaleString();
  const asOfSub = updatedLabel ? `as of ${updatedLabel}` : "no data yet";

  return (
    <>
      <PageHeader
        eyebrow="OPEN SOURCE MARKET INTELLIGENCE"
        title="Pulse Terminal"
        description="Live market telemetry, velocity trends, and emerging ecosystem signals."
        actions={
          <div className="flex items-center gap-3">
            {/* Timeframe selector — wired to GET /api/dashboard?range= */}
            <div className="flex items-center bg-card border border-border p-0.5 rounded-sm font-mono text-[10px]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(tf.label)}
                  className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                    timeframe === tf.label
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-l border-border pl-3">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot} pulse-dot`} /> {statusText}
            </span>
          </div>
        }
      />

      <div className="px-4 md:px-8 py-5 space-y-5">
        {isError ? (
          <Panel title="Connection Error" code="ERR">
            <EmptyPanel
              title="API unreachable"
              message="Could not reach the Pulse API. Check that the backend is running and VITE_API_URL points at it."
              hint="Make sure `docker compose up api` is healthy."
              actionLabel="Open Admin"
            />
          </Panel>
        ) : (
          <>
            {/* PILLAR 1: MACRO COMMAND BAR & KPI STRIP */}
            <motion.section
              {...fade}
              className="relative overflow-hidden rounded-sm border border-border bg-card"
            >
              <div className="relative p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
                      Ecosystem Velocity Radar
                    </span>
                    <span className="text-border">·</span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      <ClientDate />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <Link
                      to="/radar"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline cursor-pointer"
                    >
                      Explore Tech Radar <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <span className="text-border">·</span>
                    <Link
                      to="/reports"
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      View Weekly Briefing →
                    </Link>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-sm border border-border/80 bg-background/50 p-3.5 animate-pulse"
                      >
                        <div className="h-3 w-2/3 rounded-xs bg-secondary" />
                        <div className="mt-3 h-7 w-1/2 rounded-xs bg-secondary" />
                        <div className="mt-3 h-3 w-full rounded-xs bg-secondary/60" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <KpiCard
                      label="Repositories Tracked"
                      value={fmt(stats?.total_repos)}
                      sub={asOfSub}
                    />
                    <KpiCard
                      label={`Stars Added (${timeframe})`}
                      value={fmt(topMovers.reduce((acc, r) => acc + r.growth, 0) || null)}
                      sub={
                        topMovers.length > 0
                          ? `top ${topMovers.length} movers · ${asOfSub}`
                          : "no movers in window"
                      }
                    />
                    <KpiCard
                      label="Technologies Monitored"
                      value={stats ? `${fmt(stats.active_technologies)}` : "—"}
                      sub={
                        heatmap.length > 0
                          ? `${explodingCount} exploding · ${asOfSub}`
                          : "no scores yet"
                      }
                    />
                    <KpiCard
                      label="Language Ecosystems"
                      value={stats ? `${fmt(stats.active_languages)}` : "—"}
                      sub={asOfSub}
                    />
                  </div>
                )}
              </div>
            </motion.section>

            {/* PILLAR 2: TECHNOLOGY MARKET MATRIX + AI INSIGHT DISPATCH */}
            <div className="grid grid-cols-12 gap-5">
              <motion.div
                {...fade}
                transition={{ delay: 0.05 }}
                className="col-span-12 lg:col-span-8"
              >
                <Panel
                  title="Technology Market Matrix"
                  code="MTX"
                  action={
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Score · {timeframe}
                        {updatedLabel ? ` · ${updatedLabel}` : ""}
                      </span>
                      <Link
                        to="/radar"
                        className="text-[10px] font-mono uppercase tracking-wider text-accent hover:underline flex items-center gap-0.5"
                      >
                        Radar <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  }
                >
                  {isLoading ? (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2 animate-pulse">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="h-16 rounded-xs bg-secondary/60" />
                      ))}
                    </div>
                  ) : heatmap.length > 0 ? (
                    <div className="p-4">
                      <TechMatrix
                        items={heatmap}
                        selectedSector={selectedSector}
                        onSelectSector={setSelectedSector}
                      />
                    </div>
                  ) : (
                    <EmptyPanel
                      title="No radar scores yet"
                      message="Technology scores appear after the first radar calculation (runs daily at 03:00)."
                      hint="Trigger it manually from Admin → Radar."
                    />
                  )}
                </Panel>
              </motion.div>

              <motion.div
                {...fade}
                transition={{ delay: 0.08 }}
                className="col-span-12 lg:col-span-4"
              >
                <Panel
                  className="relative overflow-hidden h-full flex flex-col justify-between"
                  title="AI Intelligence Dispatch"
                  code="DISPATCH"
                  action={
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-accent">
                      <Sparkles className="h-3 w-3" /> Pulse AI
                    </span>
                  }
                >
                  <div className="relative p-4 space-y-4 text-[13px] flex-1">
                    {isLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-3 w-1/3 rounded-xs bg-secondary" />
                        <div className="h-16 w-full rounded-xs bg-secondary/60" />
                      </div>
                    ) : insightText ? (
                      <div>
                        <div className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.2em] text-accent bg-accent/10 px-2 py-0.5 rounded-xs">
                          Market Synthesis
                        </div>
                        <p className="mt-2.5 text-[12.5px] text-foreground/90 leading-relaxed font-sans">
                          {insightText}
                        </p>
                      </div>
                    ) : (
                      <EmptyPanel
                        title="No insight yet"
                        message="AI insights are generated daily at 08:00 once repositories are synced."
                        hint="Trigger generation from Admin → Reports."
                      />
                    )}
                  </div>

                  <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span>
                      Synthesis Engine:{" "}
                      <strong className="text-foreground font-semibold">Pulse AI</strong>
                    </span>
                    <span>
                      {dash?.weekly_insight?.generated_at ? (
                        <ClientDate date={dash.weekly_insight.generated_at} />
                      ) : (
                        "No insight yet"
                      )}
                    </span>
                  </div>
                </Panel>
              </motion.div>
            </div>

            {/* PILLAR 3: TOP MOVERS + EVENT STREAM */}
            <div className="grid grid-cols-12 gap-5">
              <motion.div
                {...fade}
                transition={{ delay: 0.12 }}
                className="col-span-12 lg:col-span-7"
              >
                <Panel
                  title={`Biggest Movers (Top Velocity · ${timeframe})`}
                  code="LEADERBOARD"
                  action={
                    <Link
                      to="/repositories"
                      className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-accent flex items-center gap-1"
                    >
                      View All Repos →
                    </Link>
                  }
                >
                  {isLoading ? (
                    <div className="p-4 space-y-2 animate-pulse">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 rounded-xs bg-secondary/60" />
                      ))}
                    </div>
                  ) : topMovers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/80 bg-background/30">
                            <th className="text-left px-3 py-2 font-medium w-12">Rank</th>
                            <th className="text-left px-3 py-2 font-medium">Repository</th>
                            <th className="text-left px-3 py-2 font-medium">Stack</th>
                            <th className="text-right px-3 py-2 font-medium">Stars</th>
                            <th className="text-right px-4 py-2 font-medium">Velocity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {topMovers.map((r, idx) => {
                            const parts = r.full_name.split("/");
                            const owner = parts[0] || "";
                            const name = parts[1] || r.full_name;
                            const isFirst = idx === 0;

                            return (
                              <tr
                                key={r.id || r.full_name}
                                className="hover:bg-card/90 transition-colors group cursor-pointer"
                              >
                                <td className="px-3 py-2.5 font-mono">
                                  <span
                                    className={`inline-flex items-center justify-center h-5 w-5 rounded-xs text-[10px] font-semibold ${
                                      isFirst
                                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold"
                                        : idx === 1
                                          ? "bg-slate-300/20 text-slate-200 border border-slate-300/30"
                                          : idx === 2
                                            ? "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                                            : "text-muted-foreground"
                                    }`}
                                  >
                                    #{idx + 1}
                                  </span>
                                </td>

                                <td className="px-3 py-2.5">
                                  <Link
                                    to="/repositories/$owner/$repo"
                                    params={{ owner, repo: name }}
                                    className="block"
                                  >
                                    <div className="text-[10px] font-mono text-muted-foreground leading-tight">
                                      {owner}
                                    </div>
                                    <div className="text-[13px] font-medium text-foreground group-hover:text-accent transition-colors">
                                      {name}
                                    </div>
                                  </Link>
                                </td>

                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-secondary/80 border border-border/80 text-foreground/80">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                    {r.primary_language || "General"}
                                  </span>
                                </td>

                                <td className="px-3 py-2.5 text-right font-mono tabular text-foreground/90">
                                  {r.stars.toLocaleString()}
                                </td>

                                <td className="px-4 py-2.5 text-right font-mono tabular">
                                  <span className="inline-flex items-center text-emerald-400 font-semibold text-[11px]">
                                    <TrendingUp className="h-3 w-3 mr-0.5" />+
                                    {r.growth.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyPanel
                      title="No movers in this window"
                      message={`No repository gained stars in the selected ${timeframe} window yet. Try a wider window or run a sync.`}
                      hint="Velocity needs at least two snapshots per repo."
                    />
                  )}
                </Panel>
              </motion.div>

              <motion.div
                {...fade}
                transition={{ delay: 0.1 }}
                className="col-span-12 lg:col-span-5"
              >
                <Panel
                  title="Intelligence Event Stream"
                  code="STREAM"
                  action={
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isError ? "bg-destructive" : "bg-emerald-400"} pulse-dot`}
                      />
                      {isError ? "OFFLINE" : `SYNCED · ${timeframe}`}
                    </span>
                  }
                >
                  {isLoading ? (
                    <div className="p-4 space-y-2 animate-pulse">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-9 rounded-xs bg-secondary/60" />
                      ))}
                    </div>
                  ) : liveEvents.length > 0 ? (
                    <ul className="divide-y divide-border/60 max-h-[380px] overflow-auto">
                      {liveEvents.map((f, i) => {
                        const { Icon, color } = feedIcon(f.kind);
                        return (
                          <li
                            key={i}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-card/70 transition-colors"
                          >
                            <span className="text-[10px] font-mono text-muted-foreground tabular w-10 pt-0.5 shrink-0">
                              {f.time}
                            </span>
                            <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                                {f.tag}
                              </div>
                              <div className="text-[12.5px] text-foreground leading-snug mt-0.5">
                                {f.text}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <EmptyPanel
                      title="No events in this window"
                      message={`Nothing moved enough in the selected ${timeframe} window to raise a signal.`}
                      hint="Events are derived from real velocity data."
                    />
                  )}
                </Panel>
              </motion.div>
            </div>

            {/* TERMINAL STATUS FOOTER STRIP */}
            <motion.div
              {...fade}
              transition={{ delay: 0.14 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-[10px] uppercase tracking-wider"
            >
              {[
                {
                  l: "Ecosystem Stream",
                  v: isLoading
                    ? "Syncing"
                    : isError
                      ? "Offline"
                      : hasAnyData
                        ? "Active"
                        : "Awaiting sync",
                  c: hasAnyData && !isError ? "text-emerald-400" : "text-muted-foreground",
                },
                { l: "Data Window", v: timeframe, c: "text-accent" },
                { l: "Dominant Cluster", v: dominantCluster, c: "text-sky-400" },
                { l: "Emerging Breakout", v: emergingBreakout, c: "text-emerald-400" },
                {
                  l: "Command Palette",
                  v: "Press ⌘K / /",
                  c: "text-muted-foreground font-semibold",
                },
              ].map((s) => (
                <div
                  key={s.l}
                  className="flex items-center justify-between px-3 py-2 rounded-sm border border-border bg-card"
                >
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className={s.c}>{s.v}</span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
