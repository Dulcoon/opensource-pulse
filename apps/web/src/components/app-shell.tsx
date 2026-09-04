import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GitBranch,
  Radar,
  BarChart3,
  FileText,
  Search,
  Bell,
  Command,
} from "lucide-react";
import { useState, useMemo, type ReactNode } from "react";
import { ticker } from "@/lib/mock-data";
import { CommandPalette } from "@/components/command-palette";
import { useRadar } from "@/hooks/use-radar";
import { useDashboard } from "@/hooks/use-dashboard";
import { ClientClock } from "@/lib/client-only";

const navItems = [
  { to: "/", label: "Terminal", icon: LayoutDashboard, code: "01", exact: true },
  { to: "/repositories", label: "Repositories", icon: GitBranch, code: "02" },
  { to: "/radar", label: "Tech Radar", icon: Radar, code: "03" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, code: "04" },
  { to: "/reports", label: "Reports", icon: FileText, code: "05" },
];

function TickerTape() {
  const { data: radarScores } = useRadar();

  const items = useMemo(() => {
    if (!radarScores || radarScores.length === 0) return ticker;
    return radarScores.slice(0, 16).map((s) => {
      const name = (s.technology?.technology_name || s.technology?.slug || `TECH-${s.technology_id}`).toUpperCase();
      const growth = s.growth_percentage ?? 0;
      return {
        sym: name,
        val: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
        up: growth >= 0,
      };
    });
  }, [radarScores]);

  const displayItems = [...items, ...items];
  return (
    <div className="h-7 border-b border-border bg-card overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-card border-r border-border">
        <span className="text-[10px] font-mono uppercase tracking-wider text-accent">PULSE/LIVE</span>
        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
      </div>
      <div className="flex items-center h-full animate-ticker whitespace-nowrap pl-32">
        {displayItems.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[11px] font-mono">
            <span className="text-muted-foreground">{t.sym}</span>
            <span className={t.up ? "text-success" : "text-destructive"}>{t.val}</span>
            <span className="text-border">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { data: radarScores } = useRadar();
  const { data: dash } = useDashboard();
  const totalRepos = dash?.weekly_statistics?.total_repos;
  const totalTech = dash?.weekly_statistics?.active_technologies;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground flex-col">
      <TickerTape />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="px-4 py-3.5 border-b border-border bg-sidebar/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <img
                src="/logo.png"
                alt="OpenSource Pulse Logo"
                className="h-8.5 w-auto object-contain"
              />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-accent font-semibold px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                v2.6
              </span>
            </div>
            <div>
              <span className="text-[15px] font-bold tracking-tight text-foreground block leading-none">
                OpenSource Pulse
              </span>
              <span className="text-[10px] text-muted-foreground font-mono tracking-wider mt-1 block">
                OSINT Market Terminal
              </span>
            </div>
          </div>

          <nav className="flex-1 px-2 py-3">
            <div className="px-2 pb-2 text-[9px] font-mono font-medium uppercase tracking-[0.18em] text-muted-foreground">Modules</div>
            <div className="space-y-px">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group relative flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] transition-colors ${
                      active
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-accent rounded-r" />}
                    <span className="text-[9px] font-mono text-muted-foreground/70 w-4">{item.code}</span>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-2 pt-5 pb-2 text-[9px] font-mono font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center justify-between">
              <span>Watchlist</span>
              <span className="text-[8px] text-accent">LIVE</span>
            </div>
            <div className="space-y-px font-mono text-[11px]">
              {(radarScores && radarScores.length > 0
                ? radarScores.slice(0, 4).map((s) => ({
                    s: (s.technology?.technology_name || s.technology?.slug || `TECH-${s.technology_id}`).toUpperCase(),
                    v: `${(s.growth_percentage ?? 0) >= 0 ? "+" : ""}${(s.growth_percentage ?? 0).toFixed(1)}%`,
                  }))
                : [
                    { s: "AI", v: "+0.2%" },
                    { s: "AGENT", v: "+0.2%" },
                    { s: "PYTHON", v: "+0.2%" },
                    { s: "REMOTION", v: "+1.5%" },
                  ]
              ).map((w) => (
                <Link
                  key={w.s}
                  to="/radar"
                  className="flex items-center justify-between px-2.5 py-1 rounded-sm hover:bg-sidebar-accent/40 cursor-pointer transition-colors"
                >
                  <span className="text-muted-foreground">{w.s}</span>
                  <span className="text-success">{w.v}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-border p-3">
            <div className="rounded-sm border border-border bg-card p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Feed online
              </div>
              <div className="mt-1 text-[11px] font-mono text-foreground font-medium">
                {totalRepos ? `${totalRepos.toLocaleString()} repos` : "Telemetry online"}
                {totalTech ? ` · ${totalTech} tech` : ""}
              </div>
              <div className="mt-0.5 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                <span>INGESTION ENGINE</span>
                <span className="text-emerald-500 text-[9px] font-semibold">200 OK</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 backdrop-blur px-4 md:px-6">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <span className="text-accent">PULSE</span>
              <span className="text-border">/</span>
              <span>{pathname === "/" ? "TERMINAL" : pathname.replace("/", "").toUpperCase()}</span>
            </div>
            <div className="flex-1 max-w-md ml-4">
              <button
                onClick={() => setPaletteOpen(true)}
                className="relative w-full h-8 rounded-sm border border-border bg-card/70 hover:bg-card pl-8 pr-16 text-left text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center"
              >
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Search repos, tech, signals…</span>
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            </div>
            <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Status: <span className="text-emerald-400 font-semibold">ONLINE</span></span>
              <span className="text-border">·</span>
              <ClientClock />
            </div>
            <button className="h-8 w-8 inline-flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-card cursor-pointer">
              <Bell className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm border border-border bg-card/60 text-[10px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-foreground font-semibold">FEED LIVE</span>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
