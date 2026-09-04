import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { useAnalytics } from "@/hooks/use-analytics";
import { ChartCard, NoData } from "@/features/analytics/components/chart-card";
import { TrendingUp, Code2, Users, Cpu } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — OpenSource Pulse" },
      {
        name: "description",
        content: "Historical trend analytics for languages, technologies, repositories, and contributors.",
      },
    ],
  }),
  component: Analytics,
});

const ranges = ["Monthly", "Quarterly", "Yearly"] as const;

const tooltipStyle = {
  backgroundColor: "#18181B",
  borderColor: "#3F3F46",
  borderRadius: "6px",
  color: "#FAFAFA",
  fontFamily: "monospace",
  fontSize: "11px",
  boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.8)",
};

const LANG_COLORS: Record<string, string> = {
  Python: "#3B82F6",
  TypeScript: "#60A5FA",
  JavaScript: "#F59E0B",
  Go: "#06B6D4",
  Rust: "#F97316",
  Markdown: "#A855F7",
  HTML: "#EF4444",
  CSS: "#EC4899",
  Java: "#EA580C",
  "C++": "#8B5CF6",
  C: "#64748B",
};

const DEFAULT_BAR_COLORS = [
  "#FF7A00",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#F97316",
];

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

function Analytics() {
  const [range, setRange] = useState<typeof ranges[number]>("Monthly");
  const { data: analytics, isLoading } = useAnalytics(range.toLowerCase());

  // 1. Language series
  const langSeries =
    analytics?.language_growth?.slice(0, 8).map((l) => ({
      name: l.language,
      stars: l.total_stars,
      repos: l.repo_count,
      color: LANG_COLORS[l.language] || "#FF7A00",
    })) ?? [];

  // 2. Technology series (Top 8 tech by avg_score)
  const topTechList =
    analytics?.technology_growth?.slice(0, 8).map((t) => ({
      name: t.tech_name,
      score: Math.round(t.avg_score),
      repos: t.repo_count,
    })) ?? [];

  // 3. Repository growth series
  const repoSeries =
    analytics?.repository_growth?.map((r) => ({
      month: r.month,
      stars: r.total_stars,
      forks: r.total_forks,
      repos: r.repo_count,
    })) ?? [];

  // 4. Contributor series
  const contribSeries =
    analytics?.contributor_trend?.map((c) => ({
      month: c.month,
      contributors: c.total_contributors,
      repos: c.repo_count,
    })) ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Analytics" description="Loading ecosystem analytics data..." />
        <div className="p-8 text-center text-muted-foreground font-mono text-xs">
          Loading time-series signals...
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="ECOSYSTEM INTELLIGENCE"
        title="Market Analytics"
        description="Macro intelligence covering language adoption, technology ranking, repository momentum, and contributor dynamics."
        actions={
          <div className="flex gap-1 rounded-sm border border-border p-0.5 bg-card">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 font-mono text-[11px] rounded-sm transition-colors ${
                  range === r
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider">Top Language</span>
              <Code2 className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {langSeries[0]?.name ?? "—"}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {langSeries[0] ? `${formatCompactNumber(langSeries[0].stars)} total stars` : "No data"}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider">Leading Tech</span>
              <Cpu className="h-3.5 w-3.5 text-success" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground truncate">
              {topTechList[0]?.name ?? "—"}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {topTechList[0] ? `Score: ${topTechList[0].score}/100` : "No data"}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider">Total Tracked Stars</span>
              <TrendingUp className="h-3.5 w-3.5 text-signal" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {repoSeries[0] ? formatCompactNumber(repoSeries[0].stars) : "—"}
            </div>
            <div className="text-[11px] font-mono text-success mt-0.5">
              {repoSeries[0] ? `Across ${repoSeries[0].repos} repos` : "Active"}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider">Active Contributors</span>
              <Users className="h-3.5 w-3.5 text-warning" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {contribSeries[0] ? formatCompactNumber(contribSeries[0].contributors) : "—"}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Community volume
            </div>
          </div>
        </div>

        {/* 2x2 Analytics Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Language Growth Chart */}
          <ChartCard title="Language Distribution" subtitle="Aggregate stars captured per programming language">
            {langSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={langSeries}
                  margin={{ top: 15, right: 10, left: -10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#A1A1AA"
                    tick={{ fill: "#E4E4E7", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                  />
                  <YAxis
                    stroke="#A1A1AA"
                    tick={{ fill: "#A1A1AA", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                    tickFormatter={formatCompactNumber}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(249, 115, 22, 0.08)" }}
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [Number(val).toLocaleString() + " stars", "Total Stars"]}
                  />
                  <Bar
                    dataKey="stars"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                    isAnimationActive={true}
                    animationDuration={900}
                    animationEasing="ease-out"
                    activeBar={{ stroke: "#F97316", strokeWidth: 2, fillOpacity: 0.95 }}
                  >
                    {langSeries.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || DEFAULT_BAR_COLORS[index % DEFAULT_BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData message="No language distribution data available." />
            )}
          </ChartCard>

          {/* 2. Top Technology Ranking & Score */}
          <ChartCard title="Technology Leadership" subtitle="Highest adoption scores among tracked technologies">
            {topTechList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topTechList}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="#A1A1AA"
                    tick={{ fill: "#A1A1AA", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#A1A1AA"
                    tick={{ fill: "#E4E4E7", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val}/100 Score`, "Adoption Score"]}
                  />
                  <Bar
                    dataKey="score"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeBar={{ stroke: "#34D399", strokeWidth: 1.5, fill: "#059669" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData message="No technology analytics data available." />
            )}
          </ChartCard>

          {/* 3. Repository Stars & Forks */}
          <ChartCard title="Repository Growth Momentum" subtitle="Total stars and fork engagement per period">
            {repoSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={repoSeries}
                  margin={{ top: 15, right: 10, left: -10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#A1A1AA"
                    tick={{ fill: "#E4E4E7", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                  />
                  <YAxis
                    stroke="#A1A1AA"
                    tick={{ fill: "#A1A1AA", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                    tickFormatter={formatCompactNumber}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [Number(val).toLocaleString(), ""]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="stars"
                    name="Stars"
                    fill="#FF7A00"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                    isAnimationActive={true}
                    animationDuration={950}
                    animationEasing="ease-out"
                    activeBar={{ stroke: "#FDBA74", strokeWidth: 1.5 }}
                  />
                  <Bar
                    dataKey="forks"
                    name="Forks"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                    isAnimationActive={true}
                    animationDuration={1100}
                    animationEasing="ease-out"
                    activeBar={{ stroke: "#93C5FD", strokeWidth: 1.5 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData message="No repository growth data available." />
            )}
          </ChartCard>

          {/* 4. Contributor Trend */}
          <ChartCard title="Contributor Engagement" subtitle="Active developer contributions across ecosystem">
            {contribSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={contribSeries}
                  margin={{ top: 15, right: 10, left: -10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#A1A1AA"
                    tick={{ fill: "#E4E4E7", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                  />
                  <YAxis
                    stroke="#A1A1AA"
                    tick={{ fill: "#A1A1AA", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3F3F46" }}
                    tickFormatter={formatCompactNumber}
                  />
                  <Tooltip
                    cursor={{ stroke: "#F59E0B", strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [Number(val).toLocaleString() + " contributors", "Contributors"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="contributors"
                    name="Contributors"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={{ fill: "#F59E0B", r: 3.5, strokeWidth: 1.5, stroke: "#18181B" }}
                    activeDot={{ r: 6, fill: "#FBBF24", stroke: "#09090b", strokeWidth: 2 }}
                    fill="url(#contribGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <NoData message="No contributor trend data available." />
            )}
          </ChartCard>
        </div>
      </div>
    </>
  );
}
