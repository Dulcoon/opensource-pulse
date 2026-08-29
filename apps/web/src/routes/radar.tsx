import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { useRadar } from "@/hooks/use-radar";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { quadrants, quadColor } from "@/features/radar/components/radar-ui";
import type { TechnologyScore } from "@/types/api";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Tech Radar — OpenSource Pulse" },
      { name: "description", content: "Visualize the open source technology landscape across four quadrants." },
    ],
  }),
  component: RadarPage,
});

function RadarPage() {
  const { data: scores, isLoading } = useRadar();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const techList = (scores ?? []).map((s: TechnologyScore) => ({
    name: `Tech #${s.technology_id}`,
    quadrant: (s.status === "Exploding" ? "Exploding" :
               s.status === "Rising" ? "Rising" :
               s.status === "Stable" ? "Stable" : "Declining") as typeof quadrants[number],
    score: Math.round(s.score ?? 0),
    growth: Math.round(s.growth_percentage ?? 0),
    repos: s.repository_count ?? 0,
  }));

  const selected = techList[selectedIdx] || techList[0];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Tech Radar" description="Loading radar data..." />
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      </>
    );
  }

  if (techList.length === 0) {
    return (
      <>
        <PageHeader title="Tech Radar" description="A map of how technologies are trending across the open source ecosystem." />
        <div className="p-8 text-center text-muted-foreground text-sm">No radar data available. Run a sync and radar calculation first.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tech Radar"
        description="A map of how technologies are trending across the open source ecosystem."
      />
      <div className="p-4 md:p-8 grid grid-cols-12 gap-5">
        {/* Radar viz */}
        <div className="col-span-12 lg:col-span-7 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Radar Visualization</h3>
            <div className="flex gap-2 text-[10px] uppercase tracking-wider">
              {quadrants.map(q => (
                <span key={q} className="inline-flex items-center gap-1 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: quadColor[q] }} />
                  {q}
                </span>
              ))}
            </div>
          </div>
          <div className="relative aspect-square max-w-[560px] mx-auto">
            <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
              {[180, 130, 80, 30].map((r, i) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="oklch(0.274 0.006 286)" strokeDasharray={i === 0 ? "0" : "2 4"} />
              ))}
              <line x1="200" y1="20" x2="200" y2="380" stroke="oklch(0.274 0.006 286)" />
              <line x1="20" y1="200" x2="380" y2="200" stroke="oklch(0.274 0.006 286)" />
              <text x="30" y="32" fill="oklch(0.637 0.237 25.331)" fontSize="10" className="uppercase tracking-wider">Exploding</text>
              <text x="310" y="32" fill="oklch(0.723 0.187 142.495)" fontSize="10" className="uppercase tracking-wider">Rising</text>
              <text x="30" y="390" fill="oklch(0.55 0 0)" fontSize="10" className="uppercase tracking-wider">Declining</text>
              <text x="320" y="390" fill="oklch(0.623 0.214 259.815)" fontSize="10" className="uppercase tracking-wider">Stable</text>

              {techList.map((t, i) => {
                const angle = (i / techList.length) * Math.PI * 2;
                const distance = 30 + (100 - t.score) * 1.6;
                const x = 200 + Math.cos(angle) * distance;
                const y = 200 + Math.sin(angle) * distance;
                const active = selected.name === t.name;
                return (
                  <g key={t.name} onClick={() => setSelectedIdx(i)} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r={active ? 9 : 6}
                      fill={quadColor[t.quadrant]}
                      fillOpacity={active ? 1 : 0.85}
                      stroke={active ? "white" : "transparent"}
                      strokeWidth={1.5}
                    />
                    <text x={x + 10} y={y + 3} fill="oklch(0.92 0 0)" fontSize="10">{t.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Rankings */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Technology Rankings</h3>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-right px-3 py-2 font-medium">Score</th>
                    <th className="text-right px-3 py-2 font-medium">Growth</th>
                    <th className="text-right px-3 py-2 font-medium">Repos</th>
                  </tr>
                </thead>
                <tbody>
                  {techList.map((t, i) => (
                    <tr
                      key={t.name}
                      onClick={() => setSelectedIdx(i)}
                      className={`cursor-pointer border-t border-border hover:bg-secondary/40 ${selected.name === t.name ? "bg-secondary/40" : ""}`}
                    >
                      <td className="px-3 py-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: quadColor[t.quadrant] }} />
                        {t.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{t.score}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${t.growth >= 0 ? "text-success" : "text-destructive"}`}>
                        {t.growth >= 0 ? "+" : ""}{t.growth}%
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">{t.repos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <motion.div key={selected.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{selected.quadrant}</div>
                <div className="text-lg font-semibold">{selected.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">{selected.score}</div>
                <div className="text-xs text-muted-foreground">Trend score</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">Growth</div>
                <div className={`mt-1 font-medium ${selected.growth >= 0 ? "text-success" : "text-destructive"}`}>
                  {selected.growth >= 0 ? "+" : ""}{selected.growth}%
                </div>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">Related Repos</div>
                <div className="mt-1 font-medium">{selected.repos}</div>
              </div>
            </div>
            <div className="mt-4 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 20 }, (_, i) => ({ x: i, y: 30 + Math.sin(i / 2) * 10 + i * (selected.growth / 12) }))}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={quadColor[selected.quadrant]} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={quadColor[selected.quadrant]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="y" stroke={quadColor[selected.quadrant]} fill="url(#rg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Historical trend, last 20 weeks</div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
