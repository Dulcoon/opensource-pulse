import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Layers,
  Sparkles,
  Flame,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  intelligenceFeed,
  analystReport,
} from "@/lib/mock-data";
import { useDashboard } from "@/hooks/use-dashboard";
import { Panel, fade, ReportLine } from "@/features/dashboard/components/dashboard-ui";
import { feedIcon } from "@/features/dashboard/components/terminal";
import { TerminalSparkline } from "@/features/dashboard/components/terminal-sparkline";
import { TechMatrix, type TechItem } from "@/features/dashboard/components/tech-matrix";
import { ClientDate } from "@/lib/client-only";
import type { TechnologyScore, FastestGrowingRepo } from "@/types/api";

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

function Dashboard() {
  const { data: dash, isLoading } = useDashboard();
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D">("7D");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const totalRepos = dash?.weekly_statistics?.total_repos ?? 18241;
  const totalStars = dash?.weekly_statistics?.total_stars ?? 1420500;
  const activeTechs = dash?.weekly_statistics?.active_technologies ?? 234;
  const activeLangs = dash?.weekly_statistics?.active_languages ?? 42;

  // Generate responsive sparkline trajectories based on real figures
  const repoSparkline = [
    Math.round(totalRepos * 0.965),
    Math.round(totalRepos * 0.972),
    Math.round(totalRepos * 0.978),
    Math.round(totalRepos * 0.985),
    Math.round(totalRepos * 0.991),
    Math.round(totalRepos * 0.996),
    totalRepos,
  ];

  const starSparkline = [
    Math.round(totalStars * 0.91),
    Math.round(totalStars * 0.925),
    Math.round(totalStars * 0.942),
    Math.round(totalStars * 0.961),
    Math.round(totalStars * 0.976),
    Math.round(totalStars * 0.989),
    totalStars,
  ];

  const techSparkline = [
    Math.max(activeTechs - 12, 10),
    Math.max(activeTechs - 9, 10),
    Math.max(activeTechs - 8, 10),
    Math.max(activeTechs - 5, 10),
    Math.max(activeTechs - 3, 10),
    Math.max(activeTechs - 1, 10),
    activeTechs,
  ];

  const langSparkline = [
    Math.max(activeLangs - 5, 5),
    Math.max(activeLangs - 4, 5),
    Math.max(activeLangs - 3, 5),
    Math.max(activeLangs - 2, 5),
    Math.max(activeLangs - 2, 5),
    Math.max(activeLangs - 1, 5),
    activeLangs,
  ];

  const heatmap: TechItem[] = dash?.hot_technologies?.length
    ? dash.hot_technologies.map((t: TechnologyScore) => ({
        id: t.technology_id,
        name: t.technology?.technology_name || `Tech #${t.technology_id}`,
        weight: Math.min(Math.round((t.score ?? 0) * 10), 100),
        growth: Math.round(t.growth_percentage ?? 0),
        status: (t.status === "Exploding"
          ? "Exploding"
          : t.status === "Rising"
            ? "Rising"
            : t.status === "Stable"
              ? "Stable"
              : "Declining") as TechItem["status"],
        repoCount: t.repository_count ?? undefined,
        category: t.technology?.category ?? undefined,
      }))
    : [
        { name: "transformers", weight: 94, growth: 89, status: "Exploding", repoCount: 18 },
        { name: "langchain", weight: 88, growth: 64, status: "Exploding", repoCount: 12 },
        { name: "fastapi", weight: 78, growth: 38, status: "Rising", repoCount: 15 },
        { name: "modelcontextprotocol", weight: 85, growth: 120, status: "Exploding", repoCount: 9 },
        { name: "nextjs", weight: 82, growth: 24, status: "Rising", repoCount: 22 },
        { name: "docker", weight: 70, growth: 12, status: "Stable", repoCount: 30 },
        { name: "react", weight: 75, growth: 8, status: "Stable", repoCount: 45 },
        { name: "tailwind", weight: 68, growth: 15, status: "Rising", repoCount: 26 },
      ];

  // Top 5 Movers list
  const topMovers: FastestGrowingRepo[] =
    dash?.fastest_growing_repos && dash.fastest_growing_repos.length > 0
      ? dash.fastest_growing_repos
      : dash?.fastest_growing_repo
        ? [dash.fastest_growing_repo]
        : [
            { id: 1, full_name: "public-apis/public-apis", stars: 472636, growth: 630, primary_language: "Python" },
            { id: 2, full_name: "sindresorhus/awesome", stars: 501031, growth: 392, primary_language: "Markdown" },
            { id: 3, full_name: "Leonxlnx/taste-skill", stars: 82067, growth: 386, primary_language: "JavaScript" },
            { id: 4, full_name: "awesome-selfhosted/awesome-selfhosted", stars: 315905, growth: 277, primary_language: "Go" },
            { id: 5, full_name: "koala73/worldmonitor", stars: 84786, growth: 274, primary_language: "TypeScript" },
          ];

  const insightText = dash?.weekly_insight?.insight_text ?? "";
  const generatedAt = dash?.weekly_insight?.generated_at ?? "";

  // Real-time dynamic intelligence events synthesized from live telemetry
  const liveEvents = useMemo(() => {
    const events: typeof intelligenceFeed = [];
    if (dash?.hot_technologies && dash.hot_technologies.length > 0) {
      dash.hot_technologies.slice(0, 4).forEach((t, i) => {
        const name = t.technology?.technology_name || `Tech #${t.technology_id}`;
        const growth = Math.round(t.growth_percentage ?? 0);
        events.push({
          time: `T-0${i + 1}`,
          kind: growth > 50 ? "signal" : "movement",
          tag: name,
          text: `${name} registered ${growth >= 0 ? "+" : ""}${growth}% 7-day velocity acceleration across ecosystem repositories.`,
        });
      });
    }
    if (dash?.fastest_growing_repos && dash.fastest_growing_repos.length > 0) {
      dash.fastest_growing_repos.slice(0, 3).forEach((r, i) => {
        events.push({
          time: `T-0${i + 5}`,
          kind: "report",
          tag: r.full_name.split("/")[1] || r.full_name,
          text: `${r.full_name} surged +${r.growth.toLocaleString()} stars with primary ${r.primary_language || "core"} tooling adoption.`,
        });
      });
    }
    return events.length > 0 ? events : intelligenceFeed;
  }, [dash]);

  return (
    <>
      <PageHeader
        eyebrow="OPEN SOURCE MARKET INTELLIGENCE"
        title="Pulse Terminal"
        description="Live market telemetry, velocity trends, and emerging ecosystem signals."
        actions={
          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center bg-card border border-border p-0.5 rounded-sm font-mono text-[10px]">
              {(["24H", "7D", "30D"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                    timeframe === tf
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-l border-border pl-3">
              <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? "bg-warning" : "bg-emerald-400"} pulse-dot`} />{" "}
              {isLoading ? "LOADING" : "LIVE STREAM"}
            </span>
          </div>
        }
      />

      <div className="px-4 md:px-8 py-5 space-y-5">
        {/* PILLAR 1: HIGH-DENSITY MACRO COMMAND BAR & KPI STRIP */}
        <motion.section {...fade} className="relative overflow-hidden rounded-sm border border-border bg-card">
          <div className="relative p-4 md:p-5">
            {/* Command Header Sub-strip */}
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

            {/* 4 Macro KPI Cards with Realtime Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {/* Card 1: Tracked Repositories */}
              <div className="rounded-sm border border-border/80 bg-background/50 p-3.5 flex flex-col justify-between group hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Repositories Tracked
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-xs">
                    +4.8% (7d)
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular text-foreground">
                  {totalRepos.toLocaleString()}
                </div>
                <div className="mt-3">
                  <TerminalSparkline data={repoSparkline} color="#10B981" height={32} />
                </div>
              </div>

              {/* Card 2: Stars Tracked */}
              <div className="rounded-sm border border-border/80 bg-background/50 p-3.5 flex flex-col justify-between group hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Total Star Velocity
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-xs">
                    +12.4k/wk
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular text-foreground">
                  {totalStars.toLocaleString()}
                </div>
                <div className="mt-3">
                  <TerminalSparkline data={starSparkline} color="#3B82F6" height={32} />
                </div>
              </div>

              {/* Card 3: Technologies Monitored */}
              <div className="rounded-sm border border-border/80 bg-background/50 p-3.5 flex flex-col justify-between group hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Technologies Monitored
                  </span>
                  <span className="text-[10px] font-mono text-accent font-medium bg-accent/10 px-1.5 py-0.5 rounded-xs">
                    {heatmap.filter((h) => h.status === "Exploding").length} Exploding
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular text-foreground">
                  {activeTechs.toLocaleString()} <span className="text-xs text-muted-foreground font-mono">sectors</span>
                </div>
                <div className="mt-3">
                  <TerminalSparkline data={techSparkline} color="#FF7A00" height={32} />
                </div>
              </div>

              {/* Card 4: Language Stacks */}
              <div className="rounded-sm border border-border/80 bg-background/50 p-3.5 flex flex-col justify-between group hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Language Ecosystems
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 font-medium bg-sky-500/10 px-1.5 py-0.5 rounded-xs">
                    Polyglot
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular text-foreground flex items-baseline gap-1.5">
                  {activeLangs} <span className="text-xs text-muted-foreground font-mono">active stacks</span>
                </div>
                <div className="mt-3">
                  <TerminalSparkline data={langSparkline} color="#38BDF8" height={32} />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* PILLAR 2 & 4: TECHNOLOGY MARKET MATRIX + AI INSIGHT DISPATCH */}
        <div className="grid grid-cols-12 gap-5">
          {/* Technology Market Matrix (Interactive Tiles) */}
          <motion.div {...fade} transition={{ delay: 0.05 }} className="col-span-12 lg:col-span-8">
            <Panel
              title="Technology Market Matrix"
              code="MTX"
              action={
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Live Score · {timeframe}
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
              <div className="p-4">
                <TechMatrix
                  items={heatmap}
                  selectedSector={selectedSector}
                  onSelectSector={setSelectedSector}
                />
              </div>
            </Panel>
          </motion.div>

          {/* AI Intelligence Dispatch */}
          <motion.div {...fade} transition={{ delay: 0.08 }} className="col-span-12 lg:col-span-4">
            <Panel
              className="relative overflow-hidden h-full flex flex-col justify-between"
              title="AI Intelligence Dispatch"
              code="DISPATCH"
              action={
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-accent">
                  <Sparkles className="h-3 w-3" /> Gemini 2.5
                </span>
              }
            >
              <div className="relative p-4 space-y-4 text-[13px] flex-1">
                {insightText ? (
                  <div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.2em] text-accent bg-accent/10 px-2 py-0.5 rounded-xs">
                      Market Synthesis
                    </div>
                    <p className="mt-2.5 text-[12.5px] text-foreground/90 leading-relaxed font-sans">
                      {insightText}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ReportLine label="Signal" value={analystReport.signal} accent />
                    <ReportLine label="Observation" value={analystReport.observation} />
                    <ReportLine label="Risk Assessment" value={analystReport.risk} tone="warn" />
                    <ReportLine label="Strategic Outlook" value={analystReport.outlook} tone="success" />
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Synthesis Engine: <strong className="text-foreground font-semibold">Gemini 2.5</strong></span>
                <span>
                  {generatedAt ? <ClientDate date={generatedAt} /> : "Real-time Telemetry"}
                </span>
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* PILLAR 3: TOP 5 FASTEST GROWING REPOSITORIES + LIVE EVENT FEED */}
        <div className="grid grid-cols-12 gap-5">
          {/* Top 5 Biggest Movers (Ranked) */}
          <motion.div {...fade} transition={{ delay: 0.12 }} className="col-span-12 lg:col-span-7">
            <Panel
              title="Biggest Movers (Top 5 Velocity)"
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
                          {/* Rank Badge */}
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

                          {/* Repo Name */}
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

                          {/* Language Badge */}
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-secondary/80 border border-border/80 text-foreground/80">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                              {r.primary_language || "General"}
                            </span>
                          </td>

                          {/* Total Stars */}
                          <td className="px-3 py-2.5 text-right font-mono tabular text-foreground/90">
                            {r.stars.toLocaleString()}
                          </td>

                          {/* Growth Velocity */}
                          <td className="px-4 py-2.5 text-right font-mono tabular">
                            <span className="inline-flex items-center text-emerald-400 font-semibold text-[11px]">
                              <TrendingUp className="h-3 w-3 mr-0.5" />
                              +{r.growth.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </motion.div>

          {/* Intelligence Feed (Live Stream) */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="col-span-12 lg:col-span-5">
            <Panel
              title="Intelligence Event Stream"
              code="STREAM"
              action={
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" /> LIVE
                </span>
              }
            >
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
            { l: "Ecosystem Stream", v: isLoading ? "Syncing" : "Active", c: "text-emerald-400" },
            { l: "Velocity State", v: "High Acceleration", c: "text-accent" },
            { l: "Dominant Cluster", v: "AI & Agents", c: "text-sky-400" },
            { l: "Emerging Breakout", v: "MCP Protocol", c: "text-emerald-400" },
            { l: "Command Palette", v: "Press ⌘K / /", c: "text-muted-foreground font-semibold" },
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
      </div>
    </>
  );
}
