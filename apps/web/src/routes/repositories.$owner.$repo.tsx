import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpRight, Check, Star, GitFork, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRepositoryByOwner, useRepositorySnapshots } from "@/hooks/use-repositories";
import { DetailCard, HealthBar } from "@/features/repositories/detail/detail-ui";

export const Route = createFileRoute("/repositories/$owner/$repo")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.owner}/${params.repo} — OpenSource Pulse` },
      { name: "description", content: `Intelligence report for ${params.owner}/${params.repo}.` },
    ],
  }),
  component: RepoDetail,
});

const ranges = ["7D", "30D", "90D"] as const;

function RepoDetail() {
  const { owner, repo } = Route.useParams();
  const [range] = useState<typeof ranges[number]>("30D");

  const { data: detail, isLoading } = useRepositoryByOwner(owner, repo);
  const { data: snapshots } = useRepositorySnapshots(detail?.repository.id ?? 0);

  const r = detail?.repository;
  const summary = detail?.summary;
  const health = detail?.health_score;

  const keyFeatures: string[] = summary?.key_features
    ? (Array.isArray(summary.key_features) ? summary.key_features : [])
    : ["Zero-config setup", "Type-safe APIs", "Excellent documentation", "Active maintainer community"];

  const useCases: string[] = summary?.use_cases
    ? (Array.isArray(summary.use_cases) ? summary.use_cases : [])
    : ["Production-grade AI agents", "Internal developer tools", "Research prototyping", "Edge deployments"];

  const similarProjects: string[] = summary?.similar_projects
    ? (Array.isArray(summary.similar_projects) ? summary.similar_projects : [])
    : [];

  const chartData = snapshots?.length
    ? [...snapshots].reverse().map((s) => ({
        day: new Date(s.captured_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        stars: s.stars,
        forks: s.forks,
      }))
    : [];

  return (
    <>
      <PageHeader
        title={`${owner} / ${repo}`}
        description={r?.description || "Loading..."}
        actions={
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:border-accent/50"
          >
            View on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        }
      />

      <div className="p-4 md:p-8 grid grid-cols-12 gap-5">
        {/* Stats row */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Stars", value: r ? r.stars.toLocaleString() : "—", icon: Star },
            { label: "Forks", value: r ? r.forks.toLocaleString() : "—", icon: GitFork },
            { label: "Open Issues", value: r ? r.open_issues.toLocaleString() : "—", icon: AlertCircle },
            { label: "Primary Language", value: r?.primary_language || "—", icon: Sparkles },
          ].map((s) => (
            <DetailCard key={s.label} className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {s.label} <s.icon className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2 text-xl font-semibold">{s.value}</div>
            </DetailCard>
          ))}
        </div>

        {/* AI Summary */}
        <DetailCard className="col-span-12 lg:col-span-8 p-6 relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
              <Sparkles className="h-3.5 w-3.5" /> AI Summary
            </div>
            {summary?.quick_summary ? (
              <>
                <h2 className="mt-3 text-lg font-semibold">Quick Summary</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{summary.quick_summary}</p>
                {summary.difficulty_level && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs">
                    <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground">Difficulty</span>
                    <span className="text-foreground">{summary.difficulty_level}</span>
                  </div>
                )}

                <h3 className="mt-6 text-sm font-semibold">Key Features</h3>
                <ul className="mt-3 space-y-2">
                  {keyFeatures.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-6 text-sm font-semibold">Use Cases</h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {useCases.map((u: string) => (
                    <div key={u} className="rounded-lg border border-border bg-background/40 p-3 text-xs">{u}</div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">
                {isLoading ? "Generating AI summary..." : "No AI summary available yet. Trigger sync to generate."}
              </div>
            )}
          </div>
        </DetailCard>

        {/* Health */}
        <DetailCard className="col-span-12 lg:col-span-4 p-5">
          <h3 className="text-sm font-semibold">Health Score</h3>
          {health ? (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-4xl font-semibold tracking-tight">{Math.round(health.overall_score ?? 0)}</div>
                <div className={`text-xs ${
                  health.status === "Excellent" ? "text-success" :
                  health.status === "Good" ? "text-signal" :
                  health.status === "Fair" ? "text-warning" : "text-destructive"
                }`}>{health.status}</div>
              </div>
              <div className="mt-5 space-y-4">
                <HealthBar label="Activity" value={Math.round(health.activity_score ?? 0)} />
                <HealthBar label="Maintenance" value={Math.round(health.maintenance_score ?? 0)} />
                <HealthBar label="Community" value={Math.round(health.community_score ?? 0)} />
                <HealthBar label="Issues" value={Math.round(health.issue_score ?? 0)} />
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              {isLoading ? "Calculating..." : "No health score yet."}
            </div>
          )}
        </DetailCard>

        {/* Growth chart */}
        <DetailCard className="col-span-12 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Growth Analytics</h3>
              <p className="text-xs text-muted-foreground">Stars and forks over time</p>
            </div>
            <div className="flex gap-1 rounded-md border border-border p-0.5 bg-background">
              {ranges.map((r) => (
                <button
                  key={r}
                  className={`px-2.5 py-1 text-xs rounded ${range === r ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.623 0.214 259.815)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.623 0.214 259.815)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.723 0.187 142.495)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.723 0.187 142.495)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.274 0.006 286)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: "oklch(0.623 0.214 259.815)", strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "oklch(0.205 0.004 285.823)",
                      border: "1px solid oklch(0.274 0.006 286)",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stars"
                    stroke="oklch(0.623 0.214 259.815)"
                    fill="url(#g1)"
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationDuration={900}
                    animationEasing="ease-out"
                    activeDot={{ r: 6, fill: "oklch(0.623 0.214 259.815)", stroke: "#09090b", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="forks"
                    stroke="oklch(0.723 0.187 142.495)"
                    fill="url(#g2)"
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationDuration={1100}
                    animationEasing="ease-out"
                    activeDot={{ r: 5, fill: "oklch(0.723 0.187 142.495)", stroke: "#09090b", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {isLoading ? "Loading..." : "No snapshot data available yet."}
              </div>
            )}
          </div>
        </DetailCard>

        {/* Similar */}
        {similarProjects.length > 0 && (
          <DetailCard className="col-span-12 p-5">
            <h3 className="text-sm font-semibold mb-4">Similar Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {similarProjects.map((p: string) => {
                const parts = p.replace("https://github.com/", "").split("/");
                const sOwner = parts[0] || "";
                const sRepo = parts[1] || p;
                return (
                  <Link
                    key={p}
                    to="/repositories/$owner/$repo"
                    params={{ owner: sOwner, repo: sRepo }}
                    className="group rounded-lg border border-border bg-background/40 p-3 hover:border-accent/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-medium group-hover:text-accent">{p}</div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </DetailCard>
        )}
      </div>
    </>
  );
}
