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
import type { ReactNode } from "react";
import { ticker } from "@/lib/mock-data";

const navItems = [
  { to: "/", label: "Terminal", icon: LayoutDashboard, code: "01", exact: true },
  { to: "/repositories", label: "Repositories", icon: GitBranch, code: "02" },
  { to: "/radar", label: "Tech Radar", icon: Radar, code: "03" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, code: "04" },
  { to: "/reports", label: "Reports", icon: FileText, code: "05" },
];

function TickerTape() {
  const items = [...ticker, ...ticker];
  return (
    <div className="h-7 border-b border-border bg-card overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-card border-r border-border">
        <span className="text-[10px] font-mono uppercase tracking-wider text-accent">PULSE/LIVE</span>
        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
      </div>
      <div className="flex items-center h-full animate-ticker whitespace-nowrap pl-32">
        {items.map((t, i) => (
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

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground flex-col">
      <TickerTape />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
            <div className="h-7 w-7 rounded-sm bg-accent flex items-center justify-center glow-orange">
              <div className="h-2 w-2 rounded-full bg-background" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold tracking-tight">OpenSource Pulse</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.18em] font-mono">OSINT · v2.6</span>
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

            <div className="px-2 pt-5 pb-2 text-[9px] font-mono font-medium uppercase tracking-[0.18em] text-muted-foreground">Watchlist</div>
            <div className="space-y-px font-mono text-[11px]">
              {[
                { s: "AI-AGENTS", v: "+42%" },
                { s: "MCP", v: "+380%" },
                { s: "RUST-WASM", v: "+28%" },
                { s: "BROWSER-AI", v: "+64%" },
              ].map((w) => (
                <div key={w.s} className="flex items-center justify-between px-2.5 py-1 rounded-sm hover:bg-sidebar-accent/40">
                  <span className="text-muted-foreground">{w.s}</span>
                  <span className="text-success">{w.v}</span>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-border p-3">
            <div className="rounded-sm border border-border bg-card p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
                Feed online
              </div>
              <div className="mt-1 text-[11px] font-mono text-foreground">18,241 repos · 234 tech</div>
              <div className="mt-0.5 text-[10px] font-mono text-muted-foreground">SYNC 00:02:14 ago</div>
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
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  placeholder="Search repos, tech, signals…"
                  className="w-full h-8 rounded-sm border border-border bg-card pl-8 pr-16 text-[12px] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Market: <span className="text-success">Bullish</span></span>
              <span className="text-border">·</span>
              <span>UTC 14:22</span>
            </div>
            <button className="h-8 w-8 inline-flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-card">
              <Bell className="h-3.5 w-3.5" />
            </button>
            <div className="h-7 w-7 rounded-sm bg-gradient-to-br from-accent to-warning" />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
