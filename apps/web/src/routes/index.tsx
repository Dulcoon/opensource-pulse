import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  weeklyStats as mockWeeklyStats,
  heatmap as mockHeatmap,
  intelligenceFeed,
  analystReport,
  type FeedKind,
} from "@/lib/mock-data";
import { useDashboard } from "@/hooks/use-dashboard";
import { Panel, fade, ReportLine } from "@/features/dashboard/components/dashboard-ui";
import { feedIcon } from "@/features/dashboard/components/terminal";
import { ClientDate } from "@/lib/client-only";
import type { TechnologyScore } from "@/types/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminal — OpenSource Pulse" },
      { name: "description", content: "The Bloomberg terminal for open source. Real-time intelligence on repositories, technologies, and emerging signals." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: dash, isLoading } = useDashboard();

  const weeklyStats = dash?.weekly_statistics
    ? [
        { label: "Repositories Tracked", value: dash.weekly_statistics.total_repos.toLocaleString(), delta: "" },
        { label: "Technologies Monitored", value: dash.weekly_statistics.active_technologies.toLocaleString(), delta: "" },
        { label: "Stars Added (7d)", value: dash.weekly_statistics.total_stars.toLocaleString(), delta: "" },
        { label: "Active Signals", value: dash.weekly_statistics.active_languages.toLocaleString(), delta: "" },
      ]
    : mockWeeklyStats;

  const heatmap = dash?.hot_technologies
    ? dash.hot_technologies.map((t: TechnologyScore) => ({
        name: t.technology?.technology_name || `Tech #${t.technology_id}`,
        weight: Math.min(Math.round((t.score ?? 0) * 10), 100),
        growth: Math.round(t.growth_percentage ?? 0),
        status: (t.status === "Exploding" ? "Exploding" :
                 t.status === "Rising" ? "Rising" :
                 t.status === "Stable" ? "Stable" : "Declining") as "Exploding" | "Rising" | "Stable" | "Declining",
      }))
    : mockHeatmap;

  const fastestRepos = dash?.fastest_growing_repo
    ? [{
        owner: dash.fastest_growing_repo.full_name.split("/")[0],
        name: dash.fastest_growing_repo.full_name.split("/")[1],
        stars: dash.fastest_growing_repo.stars,
        growth: dash.fastest_growing_repo.growth,
        lang: "",
        description: "",
        trend: 0,
        health: 0,
        signal: "Bullish" as const,
        confidence: 0,
        category: "",
      }]
    : [];

  const insightText = dash?.weekly_insight?.insight_text ?? "";
  const generatedAt = dash?.weekly_insight?.generated_at ?? "";

  return (
    <>
      <PageHeader
        eyebrow="OPEN SOURCE INTELLIGENCE"
        title="Pulse Terminal"
        description="Live market signals across the open source ecosystem."
        actions={
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? "bg-warning" : "bg-success"} pulse-dot`} /> {isLoading ? "LOADING" : "LIVE"}
          </span>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-5">
        {/* HERO — Intelligence Header */}
        <motion.section {...fade} className="relative overflow-hidden rounded-sm border border-border bg-card">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <div className="relative grid grid-cols-12 gap-6 p-6 md:p-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent">
                Market Signal · <ClientDate />
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
                Pulse AI <span className="text-muted-foreground">is tracking</span>
                <br />the open source market.
              </h2>
              <p className="mt-4 max-w-xl text-[13px] text-muted-foreground leading-relaxed">
                Tracking <span className="text-foreground font-mono">{dash?.weekly_statistics?.total_repos?.toLocaleString() ?? "—"}</span> repositories across{" "}
                <span className="text-foreground font-mono">{dash?.weekly_statistics?.active_technologies?.toLocaleString() ?? "—"}</span> technologies.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/radar" className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:opacity-90 font-mono uppercase tracking-wider">
                  Open Radar <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider">
                  Weekly Report
                </Link>
              </div>
            </div>

            {/* Hero KPI block */}
            <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-2">
              {weeklyStats.map((s) => (
                <div key={s.label} className="rounded-sm border border-border bg-background/40 p-3">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="mt-1.5 text-xl font-semibold tabular tracking-tight">{s.value}</div>
                  <div className="mt-0.5 text-[10px] font-mono text-success">{s.delta}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Heatmap + Insight */}
        <div className="grid grid-cols-12 gap-5">
          {/* Technology Heatmap */}
          <motion.div {...fade} transition={{ delay: 0.05 }} className="col-span-12 lg:col-span-8">
            <Panel title="Technology Heatmap" code="HMP" action={
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">live · score</span>
            }>
              <div className="p-4 space-y-1.5">
                {heatmap.map((h) => {
                  const barColor =
                    h.status === "Exploding" ? "bg-accent" :
                    h.status === "Rising"    ? "bg-success" :
                    h.status === "Stable"    ? "bg-signal" :
                                               "bg-destructive";
                  return (
                    <div key={h.name} className="group grid grid-cols-12 items-center gap-3 px-1 py-1 rounded-sm hover:bg-background/40">
                      <div className="col-span-3 md:col-span-2 text-[12px] font-mono truncate">{h.name}</div>
                      <div className="col-span-7 md:col-span-8">
                        <div className="h-5 w-full rounded-sm bg-background/60 border border-border overflow-hidden relative">
                          <div
                            className={`h-full ${barColor} opacity-90 transition-all`}
                            style={{ width: `${h.weight}%` }}
                          />
                          <div className="absolute inset-y-0 right-2 flex items-center text-[10px] font-mono text-foreground/80">
                            {h.weight}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-2 text-right text-[11px] font-mono">
                        <span className={h.growth >= 0 ? "text-success" : "text-destructive"}>
                          {h.growth >= 0 ? "+" : ""}{h.growth}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </motion.div>

          {/* AI Analyst Report */}
          <motion.div {...fade} transition={{ delay: 0.08 }} className="col-span-12 lg:col-span-4">
            <Panel className="relative overflow-hidden h-full" title="AI Insight" code="AI" action={
              generatedAt ? <span className="text-[10px] font-mono uppercase tracking-wider text-accent"><ClientDate date={generatedAt} /></span> : null
            }>
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/15 blur-3xl" aria-hidden />
              <div className="relative p-5 space-y-4 text-[13px]">
                {insightText ? (
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-accent">Weekly Insight</div>
                    <p className="mt-1 text-[12.5px] text-foreground/90 leading-relaxed">{insightText}</p>
                  </div>
                ) : (
                  <>
                    <ReportLine label="Signal" value={analystReport.signal} accent />
                    <ReportLine label="Observation" value={analystReport.observation} />
                    <ReportLine label="Risk" value={analystReport.risk} tone="warn" />
                    <ReportLine label="Outlook" value={analystReport.outlook} tone="success" />
                  </>
                )}
                <div className="pt-2 mt-2 border-t border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Generated by Pulse AI · {isLoading ? "loading" : generatedAt ? <ClientDate date={generatedAt} /> : "mock data"}
                </div>
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* Intelligence Feed + Fastest Movers */}
        <div className="grid grid-cols-12 gap-5">
          <motion.div {...fade} transition={{ delay: 0.1 }} className="col-span-12 lg:col-span-5">
            <Panel title="Intelligence Feed" code="FEED" action={
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" /> LIVE
              </span>
            }>
              <ul className="divide-y divide-border max-h-[420px] overflow-auto">
                {intelligenceFeed.map((f, i) => {
                  const { Icon, color } = feedIcon(f.kind);
                  return (
                    <li key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-background/40">
                      <span className="text-[10px] font-mono text-muted-foreground tabular w-10 pt-0.5">{f.time}</span>
                      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{f.tag}</div>
                        <div className="text-[12.5px] text-foreground leading-snug">{f.text}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </motion.div>

          <motion.div {...fade} transition={{ delay: 0.12 }} className="col-span-12 lg:col-span-7">
            <Panel title="Biggest Movers" code="MOV" action={
              <Link to="/repositories" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-accent">All →</Link>
            }>
              <div className="overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="text-left px-4 py-2 font-medium">Repository</th>
                      <th className="text-left px-2 py-2 font-medium">Stars</th>
                      <th className="text-right px-4 py-2 font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fastestRepos.length > 0 ? fastestRepos.map((r) => (
                      <tr key={`${r.owner}/${r.name}`} className="border-b border-border/60 last:border-0 hover:bg-background/40">
                        <td className="px-4 py-2.5">
                          <Link to="/repositories/$owner/$repo" params={{ owner: r.owner, repo: r.name }} className="group">
                            <div className="text-[10px] font-mono text-muted-foreground">{r.owner}</div>
                            <div className="text-[13px] font-medium group-hover:text-accent">{r.name}</div>
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 font-mono tabular">{r.stars.toLocaleString()}</td>
                        <td className={`px-4 py-2.5 text-right font-mono tabular ${r.growth >= 0 ? "text-success" : "text-destructive"}`}>
                          {r.growth >= 0 ? <TrendingUp className="inline h-3 w-3 mr-0.5" /> : <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                          {r.growth >= 0 ? "+" : ""}{r.growth}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-[12px]">
                          {isLoading ? "Loading..." : "No data yet. Run a sync first."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* Status footer strip */}
        <motion.div {...fade} transition={{ delay: 0.14 }} className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-[10px] uppercase tracking-wider">
          {[
            { l: "Market", v: isLoading ? "Loading" : "Active", c: "text-success" },
            { l: "Volatility", v: "Medium", c: "text-warning" },
            { l: "Top Sector", v: "AI", c: "text-accent" },
            { l: "Watch", v: "MCP", c: "text-accent" },
            { l: "Risk Index", v: "—", c: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.l} className="flex items-center justify-between px-3 py-2 rounded-sm border border-border bg-card">
              <span className="text-muted-foreground">{s.l}</span>
              <span className={s.c}>{s.v}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
}


