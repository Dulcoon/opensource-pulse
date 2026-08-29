import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { PageHeader } from "@/components/page-header";
import { useAnalytics } from "@/hooks/use-analytics";
import { ChartCard, NoData } from "@/features/analytics/components/chart-card";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — OpenSource Pulse" },
      { name: "description", content: "Historical trend analytics for languages, technologies, repositories, and contributors." },
    ],
  }),
  component: Analytics,
});

const ranges = ["Monthly", "Quarterly", "Yearly"] as const;
const tooltipStyle = {
  background: "oklch(0.205 0.004 285.823)",
  border: "1px solid oklch(0.274 0.006 286)",
  borderRadius: 8,
  fontSize: 12,
};

function Analytics() {
  const [range] = useState<typeof ranges[number]>("Monthly");
  const { data: analytics, isLoading } = useAnalytics(range.toLowerCase());

  const langData = analytics?.language_growth?.slice(0, 12).map((l) => ({
    month: l.language,
    [l.language]: l.total_stars,
  })) ?? [];

  const langSeries = analytics?.language_growth?.slice(0, 5).map((l) => ({
    name: l.language,
    stars: l.total_stars,
    repos: l.repo_count,
  })) ?? [];

  const techSeries = analytics?.technology_growth?.slice(0, 12).map((t) => ({
    month: t.month,
    [t.tech_name]: t.avg_score,
  })) ?? [];

  const repoSeries = analytics?.repository_growth?.slice(0, 12).map((r) => ({
    month: r.month,
    stars: r.total_stars,
    forks: r.total_forks,
    repos: r.repo_count,
  })) ?? [];

  const contribSeries = analytics?.contributor_trend?.slice(0, 12).map((c) => ({
    month: c.month,
    contributors: c.total_contributors,
    repos: c.repo_count,
  })) ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Analytics" description="Loading analytics data..." />
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Historical trend analysis across the open source landscape."
        actions={
          <div className="flex gap-1 rounded-md border border-border p-0.5 bg-card">
            {ranges.map((r) => (
              <button
                key={r}
                className={`px-2.5 py-1 text-xs rounded ${range === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Language Growth" subtitle="Stars per language">
          {langSeries.length > 0 ? (
            <BarChart data={langSeries}>
              <CartesianGrid stroke="oklch(0.274 0.006 286)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="stars" fill="oklch(0.623 0.214 259.815)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Technology Growth" subtitle="Top tracked tech over time">
          {techSeries.length > 0 ? (
            <LineChart data={techSeries}>
              <CartesianGrid stroke="oklch(0.274 0.006 286)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {analytics?.technology_growth?.slice(0, 5).map((t, i) => {
                const colors = ["oklch(0.623 0.214 259.815)", "oklch(0.723 0.187 142.495)", "oklch(0.769 0.165 70.08)", "oklch(0.65 0.18 305)", "oklch(0.637 0.237 25.331)"];
                return (
                  <Line key={t.tech_name} type="monotone" dataKey={t.tech_name} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                );
              })}
            </LineChart>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Repository Growth" subtitle="Stars tracked per period">
          {repoSeries.length > 0 ? (
            <BarChart data={repoSeries}>
              <CartesianGrid stroke="oklch(0.274 0.006 286)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.245 0.006 285.823)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="stars" fill="oklch(0.623 0.214 259.815)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="forks" fill="oklch(0.723 0.187 142.495)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Contributor Trend" subtitle="Active contributors across tracked repos">
          {contribSeries.length > 0 ? (
            <AreaChart data={contribSeries}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.723 0.187 142.495)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.723 0.187 142.495)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.274 0.006 286)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="contributors" stroke="oklch(0.723 0.187 142.495)" fill="url(#cg)" strokeWidth={2} />
            </AreaChart>
          ) : <NoData />}
        </ChartCard>
      </div>
    </>
  );
}


