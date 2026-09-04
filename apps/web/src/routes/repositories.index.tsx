import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  LayoutGrid,
  List,
  GitFork,
  AlertCircle,
  TrendingUp,
  Percent,
  Flame,
  ShieldCheck,
  Zap,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Sparkles,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRepositories } from "@/hooks/use-repositories";
import { RepoPeekDrawer } from "@/features/repositories/components/repo-peek-drawer";
import type { Repository } from "@/types/api";

export const Route = createFileRoute("/repositories/")({
  head: () => ({
    meta: [
      { title: "Repositories — OpenSource Pulse" },
      {
        name: "description",
        content: "Institutional intelligence on tracked open-source repository assets.",
      },
    ],
  }),
  component: Repositories,
});

const MARKET_TIERS = [
  { label: "All Tiers", value: "all", Icon: Sparkles },
  {
    label: "Emerging Breakout",
    value: "breakout",
    Icon: TrendingUp,
    badge: "< 40k ★",
    activeClass: "bg-violet-500 text-white font-semibold shadow-xs",
    idleClass: "text-violet-300/80 hover:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30",
  },
  {
    label: "Ecosystem Pillar",
    value: "pillar",
    Icon: Zap,
    badge: "40k–100k ★",
    activeClass: "bg-sky-500 text-white font-semibold shadow-xs",
    idleClass: "text-sky-300/80 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30",
  },
  {
    label: "High Velocity",
    value: "velocity",
    Icon: Flame,
    badge: "100k–300k ★",
    activeClass: "bg-emerald-500 text-white font-semibold shadow-xs",
    idleClass: "text-emerald-300/80 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30",
  },
  {
    label: "Megacap Anchor",
    value: "megacap",
    Icon: ShieldCheck,
    badge: "300k+ ★",
    activeClass: "bg-amber-500 text-slate-950 font-semibold shadow-xs",
    idleClass: "text-amber-300/80 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30",
  },
] as const;

const SORTS = [
  { label: "Total Stars", key: "stars", tooltip: "Rank by historical accumulated stars" },
  { label: "Velocity / Utility", key: "velocity", tooltip: "Rank by fork-to-star utility ratio (deployment velocity)" },
  { label: "Forks (Adoption)", key: "forks", tooltip: "Rank by total community forks" },
  { label: "Recently Updated", key: "updated_at", tooltip: "Rank by latest commit activity" },
];

function getRepoSignal(r: Repository) {
  if (r.stars >= 300000) {
    return {
      label: "Megacap Anchor",
      color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
      Icon: ShieldCheck,
    };
  }
  if (r.stars >= 100000) {
    return {
      label: "High Velocity",
      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
      Icon: Flame,
    };
  }
  if (r.stars >= 40000) {
    return {
      label: "Ecosystem Pillar",
      color: "border-sky-500/40 bg-sky-500/10 text-sky-300",
      dot: "bg-sky-400",
      Icon: Zap,
    };
  }
  return {
    label: "Emerging Breakout",
    color: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    dot: "bg-violet-400",
    Icon: TrendingUp,
  };
}

function Repositories() {
  const [searchInput, setSearchInput] = useState("");
  const [activeLang, setActiveLang] = useState("");
  const [activeTier, setActiveTier] = useState<string>("all");
  const [activeSort, setActiveSort] = useState("stars");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [peekTarget, setPeekTarget] = useState<{ owner: string; repo: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Fetch all repositories (client-side filtering provides instantaneous instant feedback)
  const { data: repos, isLoading } = useRepositories();

  // Dynamic available languages computed directly from active dataset (eliminates dead filters)
  const availableLanguages = useMemo(() => {
    if (!repos) return [{ label: "All", value: "", count: 0 }];
    const map = new Map<string, number>();
    repos.forEach((r) => {
      const lang = r.primary_language || "Universal";
      map.set(lang, (map.get(lang) || 0) + 1);
    });
    return [
      { label: "All", value: "", count: repos.length },
      ...Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([lang, count]) => ({
          label: lang,
          value: lang === "Universal" ? "Universal" : lang,
          count,
        })),
    ];
  }, [repos]);

  // Compute live count per Market Tier for telemetry badges
  const tierCounts = useMemo(() => {
    if (!repos) return { all: 0, breakout: 0, pillar: 0, velocity: 0, megacap: 0 };
    return {
      all: repos.length,
      breakout: repos.filter((r) => r.stars < 40000).length,
      pillar: repos.filter((r) => r.stars >= 40000 && r.stars < 100000).length,
      velocity: repos.filter((r) => r.stars >= 100000 && r.stars < 300000).length,
      megacap: repos.filter((r) => r.stars >= 300000).length,
    };
  }, [repos]);

  // Client-side real-time multi-dimensional filtering & sorting
  const filteredRepos = useMemo(() => {
    if (!repos) return [];
    let list = [...repos];

    // 1. Text Search Filter (name, owner, or description)
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.repository_name.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // 2. Market Tier Filter
    if (activeTier !== "all") {
      if (activeTier === "breakout") {
        list = list.filter((r) => r.stars < 40000);
      } else if (activeTier === "pillar") {
        list = list.filter((r) => r.stars >= 40000 && r.stars < 100000);
      } else if (activeTier === "velocity") {
        list = list.filter((r) => r.stars >= 100000 && r.stars < 300000);
      } else if (activeTier === "megacap") {
        list = list.filter((r) => r.stars >= 300000);
      }
    }

    // 3. Language Filter
    if (activeLang) {
      if (activeLang === "Universal") {
        list = list.filter((r) => !r.primary_language || r.primary_language === "Universal");
      } else {
        list = list.filter((r) => r.primary_language === activeLang);
      }
    }

    // 4. Multi-metric Sorting
    if (activeSort === "velocity") {
      // Fork-to-star ratio: proxy for deployment & engineering utility velocity
      list.sort((a, b) => (b.forks / (b.stars || 1)) - (a.forks / (a.stars || 1)));
    } else if (activeSort === "forks") {
      list.sort((a, b) => b.forks - a.forks);
    } else if (activeSort === "updated_at") {
      list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else {
      list.sort((a, b) => b.stars - a.stars);
    }

    return list;
  }, [repos, searchInput, activeTier, activeLang, activeSort]);

  const totalItems = filteredRepos.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRepos = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRepos.slice(start, start + pageSize);
  }, [filteredRepos, safePage, pageSize]);

  const startIndex = totalItems > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const isFiltered = Boolean(
    searchInput.trim() || activeLang || activeTier !== "all" || activeSort !== "stars"
  );

  const resetAllFilters = () => {
    setSearchInput("");
    setActiveLang("");
    setActiveTier("all");
    setActiveSort("stars");
    setPage(1);
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <>
      <PageHeader
        eyebrow="MARKET ASSET MONITOR"
        title="Repository Explorer"
        description="Comprehensive telemetry, liquidity velocity, and health scores across tracked open source assets."
      />

      <div className="px-4 md:px-8 py-5 space-y-4">
        {/* TOP CONTROLS & FILTER BAR */}
        <div className="rounded-sm border border-border bg-card p-3.5 space-y-3 shadow-xs">
          {/* Row 1: Search, View Switcher & Reset Filter Button */}
          <div className="flex flex-col md:flex-row gap-2.5 md:items-center">
            {/* Real-time search input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search repository by name, owner, or topics in real-time…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="w-full h-8.5 rounded-sm border border-border bg-background pl-8 pr-3 text-[12px] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Optional Reset Filter Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-8.5 px-3 rounded-sm border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Reset all search queries, language, and tier filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}

            {/* View Switcher: Card Grid vs Table Ledger */}
            <div className="flex items-center gap-1 bg-background border border-border p-0.5 rounded-sm shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid Card View"
                className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Dense Table / Ledger View"
                className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Market Tier Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Market Tier:
            </span>
            {MARKET_TIERS.map((tier) => {
              const active = activeTier === tier.value;
              const TierIcon = tier.Icon;
              const count = tierCounts[tier.value as keyof typeof tierCounts] ?? 0;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => {
                    setActiveTier(tier.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-xs text-[10px] font-mono tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
                    active
                      ? tier.value === "all"
                        ? "bg-accent text-accent-foreground border-accent font-semibold shadow-xs"
                        : `${tier.activeClass} border-transparent`
                      : tier.value === "all"
                        ? "text-muted-foreground hover:text-foreground bg-background hover:bg-card border-border/60"
                        : `${tier.idleClass}`
                  }`}
                >
                  <TierIcon className="h-2.5 w-2.5" />
                  <span>{tier.label}</span>
                  <span className="opacity-70 text-[9px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Dynamic Language Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
              <span className="text-muted-foreground mr-1">Language:</span>
              {availableLanguages.map((lang) => {
                const active = activeLang === lang.value;
                return (
                  <button
                    key={lang.value || "all"}
                    type="button"
                    onClick={() => {
                      setActiveLang(lang.value);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer border ${
                      active
                        ? "bg-accent text-accent-foreground font-semibold shadow-xs border-accent"
                        : "text-muted-foreground hover:text-foreground bg-background hover:bg-card border-border/60"
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="ml-1 opacity-70">({lang.count})</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] font-mono text-muted-foreground">
              Showing <strong className="text-foreground">{startIndex}–{endIndex}</strong> of <strong className="text-accent">{totalItems}</strong> tracked assets
            </div>
          </div>
        </div>

        {/* SORT TABS */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-1 overflow-x-auto">
            {SORTS.map((s) => {
              const active = activeSort === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  title={s.tooltip}
                  onClick={() => {
                    setActiveSort(s.key);
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-[11px] font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "border-accent text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rank by {s.label}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground hidden sm:block shrink-0">
            Page {safePage} of {totalPages}
          </div>
        </div>

        {/* CONTENT VIEW: GRID OR TABLE */}
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground text-[12px] font-mono">
            Scanning and loading tracked repositories...
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-[12px] font-mono border border-dashed border-border rounded-sm">
            No repositories matched your search or language filters.
          </div>
        ) : viewMode === "grid" ? (
          /* CARD GRID VIEW (NO REDUNDANCY, DUAL ACTION & QUICK PEEK) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {paginatedRepos.map((r, idx) => {
              const globalRank = (safePage - 1) * pageSize + idx + 1;
              const signal = getRepoSignal(r);
              const SignalIcon = signal.Icon;
              const forkRatio = r.stars > 0 ? ((r.forks / r.stars) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={r.id}
                  className="group rounded-sm border border-border bg-card hover:border-accent/60 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-150 flex flex-col justify-between"
                >
                  {/* Card Header: Language Pill & Dynamic Signal */}
                  <div className="flex items-center justify-between px-3.5 h-9 border-b border-border/70 bg-background/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/80 font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {r.primary_language || "Universal"}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-[10px] font-mono text-muted-foreground">Rank #{globalRank}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${signal.color}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${signal.dot}`} />
                        <SignalIcon className="h-2.5 w-2.5" />
                        {signal.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body with GitHub Avatar Anchor */}
                  <div
                    onClick={() => setPeekTarget({ owner: r.owner, repo: r.repository_name })}
                    className="p-4 flex-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* GitHub Owner Avatar */}
                        <img
                          src={`https://github.com/${r.owner}.png?size=64`}
                          alt={r.owner}
                          loading="lazy"
                          className="h-10 w-10 rounded-sm border border-border bg-card shrink-0 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">
                            {r.owner}
                          </div>
                          <div className="text-base font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                            {r.repository_name}
                          </div>
                        </div>
                      </div>

                      {/* Prominent Stars */}
                      <div className="text-right shrink-0">
                        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                          Stars
                        </div>
                        <div className="text-xl font-bold font-mono text-foreground tracking-tight flex items-baseline justify-end gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          {r.stars.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Repository Description */}
                    <p className="mt-2.5 text-[12px] text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                      {r.description || "No public summary provided for this repository."}
                    </p>
                  </div>

                  {/* Card Metrics Strip */}
                  <div className="px-4 pb-3 grid grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="rounded-xs border border-border/80 bg-background/50 px-2 py-1.5 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <GitFork className="h-2.5 w-2.5" /> Forks
                      </span>
                      <span className="mt-0.5 text-foreground font-medium tabular">
                        {r.forks.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xs border border-border/80 bg-background/50 px-2 py-1.5 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-2.5 w-2.5" /> Issues
                      </span>
                      <span
                        className={`mt-0.5 font-medium tabular ${
                          r.open_issues > 500 ? "text-amber-400" : "text-foreground"
                        }`}
                      >
                        {r.open_issues.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xs border border-border/80 bg-background/50 px-2 py-1.5 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Percent className="h-2.5 w-2.5" /> Utility
                      </span>
                      <span className="mt-0.5 text-emerald-400 font-medium tabular">
                        {forkRatio}% fork
                      </span>
                    </div>

                    <div className="rounded-xs border border-border/80 bg-background/50 px-2 py-1.5 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        Watchers
                      </span>
                      <span className="mt-0.5 text-foreground/80 font-medium tabular">
                        {r.watchers.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer: Clear Intent & Navigation */}
                  <div className="px-3.5 py-2 border-t border-border/70 bg-background/50 flex items-center justify-between gap-2">
                    {/* Quick Peek Button */}
                    <button
                      type="button"
                      onClick={() => setPeekTarget({ owner: r.owner, repo: r.repository_name })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-card hover:bg-secondary hover:border-accent/50 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <Eye className="h-3 w-3 text-accent" />
                      <span>Quick Peek</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* View on GitHub Button */}
                      <a
                        href={r.repository_url || `https://github.com/${r.owner}/${r.repository_name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                        title="Open on GitHub.com"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>

                      {/* Full Intelligence Dossier Link */}
                      <Link
                        to="/repositories/$owner/$repo"
                        params={{ owner: r.owner, repo: r.repository_name }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground text-[11px] font-mono font-semibold transition-all cursor-pointer"
                      >
                        <span>Inspect Dossier</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DENSE TABLE / LEDGER VIEW (FINANCIAL TERMINAL GRADE) */
          <div className="rounded-sm border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-background/40">
                    <th className="text-left px-3 py-2.5 font-medium w-12">#</th>
                    <th className="text-left px-3 py-2.5 font-medium">Asset</th>
                    <th className="text-left px-3 py-2.5 font-medium">Language</th>
                    <th className="text-left px-3 py-2.5 font-medium">Market Tier</th>
                    <th className="text-right px-3 py-2.5 font-medium">Stars</th>
                    <th className="text-right px-3 py-2.5 font-medium">Forks</th>
                    <th className="text-right px-3 py-2.5 font-medium">Issues</th>
                    <th className="text-right px-4 py-2.5 font-medium w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedRepos.map((r, idx) => {
                    const globalRank = (safePage - 1) * pageSize + idx + 1;
                    const signal = getRepoSignal(r);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-card/90 transition-colors group cursor-pointer"
                      >
                        <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">
                          #{globalRank}
                        </td>
                        <td className="px-3 py-2.5">
                          <div
                            onClick={() => setPeekTarget({ owner: r.owner, repo: r.repository_name })}
                            className="flex items-center gap-2.5 cursor-pointer"
                          >
                            <img
                              src={`https://github.com/${r.owner}.png?size=40`}
                              alt={r.owner}
                              loading="lazy"
                              className="h-7 w-7 rounded-sm border border-border bg-background shrink-0 object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono text-muted-foreground block leading-tight">
                                {r.owner}
                              </span>
                              <span className="font-semibold text-foreground group-hover:text-accent transition-colors block leading-snug">
                                {r.repository_name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-foreground/80">
                          {r.primary_language || "Universal"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${signal.color}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${signal.dot}`} />
                            {signal.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground tabular">
                          {r.stars.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-foreground/80 tabular">
                          {r.forks.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-foreground/80 tabular">
                          {r.open_issues.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPeekTarget({ owner: r.owner, repo: r.repository_name })}
                              className="h-7 w-7 rounded-xs border border-border bg-background hover:bg-secondary hover:border-accent/50 inline-flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
                              title="Quick Intelligence Peek"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <Link
                              to="/repositories/$owner/$repo"
                              params={{ owner: r.owner, repo: r.repository_name }}
                              className="h-7 px-2 rounded-xs bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground text-[10px] font-mono font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Inspect Full Intelligence Dossier"
                            >
                              <span>Dossier</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGINATION & DENSITY CONTROL BAR */}
        {totalItems > 0 && (
          <div className="rounded-sm border border-border bg-card px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] font-mono">
            {/* Left: Telemetry Counter */}
            <div className="text-muted-foreground text-[11px] flex items-center gap-1.5">
              <span>Showing</span>
              <span className="text-foreground font-semibold font-mono">{startIndex}–{endIndex}</span>
              <span>of</span>
              <span className="text-accent font-semibold font-mono">{totalItems}</span>
              <span>assets</span>
            </div>

            {/* Center: Numeric Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safePage === 1}
                className="h-7 w-7 rounded-sm border border-border bg-background inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="h-7 w-7 rounded-sm border border-border bg-background inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((p, pIdx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${pIdx}`} className="px-1 text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`h-7 min-w-7 px-2 rounded-sm border text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                        safePage === p
                          ? "border-accent bg-accent text-accent-foreground shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-accent/50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="h-7 w-7 rounded-sm border border-border bg-background inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage === totalPages}
                className="h-7 w-7 rounded-sm border border-border bg-background inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Right: Page Size Density Selector */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Show:</span>
              <div className="flex items-center gap-1 bg-background border border-border p-0.5 rounded-sm">
                {[12, 24, 48].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
                      pageSize === size
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-OVER QUICK PEEK DRAWER */}
      <RepoPeekDrawer
        owner={peekTarget?.owner ?? null}
        repo={peekTarget?.repo ?? null}
        isOpen={!!peekTarget}
        onClose={() => setPeekTarget(null)}
      />
    </>
  );
}
