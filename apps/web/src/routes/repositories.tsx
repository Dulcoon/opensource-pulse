import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRepositories } from "@/hooks/use-repositories";
import { Metric } from "@/features/dashboard/components/terminal";

export const Route = createFileRoute("/repositories")({
  head: () => ({
    meta: [
      { title: "Repositories — OpenSource Pulse" },
      { name: "description", content: "Intelligence reports for the most-watched open source repositories." },
    ],
  }),
  component: Repositories,
});

const filters = [
  { label: "LANG", key: "language" as const },
  { label: "SORT", key: "sort" as const },
];

const languages = ["", "TypeScript", "Python", "Rust", "Go", "JavaScript", "Java", "C++", "Ruby"];

const sorts = ["stars", "forks", "updated_at"];

function Repositories() {
  const [searchInput, setSearchInput] = useState("");
  const [activeLang, setActiveLang] = useState("");
  const [activeSort, setActiveSort] = useState("stars");
  const [submitted, setSubmitted] = useState(false);

  const { data: repos, isLoading } = useRepositories(
    submitted ? searchInput : undefined,
    activeLang
  );

  const handleSearch = () => {
    setSubmitted(true);
  };

  const sorted = repos ? [...repos].sort((a, b) => {
    if (activeSort === "forks") return b.forks - a.forks;
    if (activeSort === "updated_at") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    return b.stars - a.stars;
  }) : [];

  return (
    <>
      <PageHeader
        eyebrow="MARKET INTELLIGENCE"
        title="Repository Explorer"
        description="Each repository is analyzed as a tracked asset — trend, signal, health, and AI confidence."
      />
      <div className="px-4 md:px-8 py-5 space-y-5">
        {/* Search & filters */}
        <div className="rounded-sm border border-border bg-card p-3 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search repo name, owner…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-8 rounded-sm border border-border bg-background pl-8 pr-3 text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <div className="flex items-center gap-1 rounded-sm border border-border bg-background px-2.5 h-8">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">LANG</span>
              <select
                value={activeLang}
                onChange={(e) => { setActiveLang(e.target.value); setSubmitted(true); }}
                className="bg-transparent text-[11px] font-mono text-foreground border-none focus:outline-none"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l || "All"}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-0 border-b border-border">
          {sorts.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSort(s)}
              className={`px-3 py-2 text-[11px] font-mono uppercase tracking-wider border-b-2 transition-colors ${
                activeSort === s ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
          <div className="ml-auto text-[11px] font-mono uppercase tracking-wider text-muted-foreground py-2">
            {repos ? `${repos.length} assets` : "—"}
          </div>
        </div>

        {/* Repo cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {isLoading ? (
            <div className="col-span-2 py-12 text-center text-muted-foreground text-[12px] font-mono">Loading repositories...</div>
          ) : sorted.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-muted-foreground text-[12px] font-mono">
              {submitted ? "No repositories found. Try a different search." : "No data yet. Run a sync from the backend."}
            </div>
          ) : (
            sorted.map((r) => {
              const signal = r.stars > 10000 ? "Strong Bullish" : r.stars > 5000 ? "Bullish" : "Neutral" as const;
              return (
                <Link
                  key={r.id}
                  to="/repositories/$owner/$repo"
                  params={{ owner: r.owner, repo: r.repository_name }}
                  className="group rounded-sm border border-border bg-card hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between px-4 h-9 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-accent">{r.primary_language || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                        signal === "Strong Bullish" ? "bg-accent/10 text-accent border-accent/40" :
                        signal === "Bullish" ? "bg-success/10 text-success border-success/30" :
                        "bg-signal/10 text-signal border-signal/30"
                      }`}>
                        {signal}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{r.owner}</div>
                        <div className="text-base font-semibold truncate group-hover:text-accent">{r.repository_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Stars</div>
                        <div className="text-2xl font-semibold tabular leading-none">{r.stars.toLocaleString()}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2">{r.description || "No description"}</p>

                    <div className="mt-4 grid grid-cols-4 gap-2 font-mono">
                      <Metric label="Stars" value={r.stars.toLocaleString()} tone="up" />
                      <Metric label="Forks" value={r.forks.toLocaleString()} tone="neutral" />
                      <Metric label="Issues" value={r.open_issues.toLocaleString()} tone={r.open_issues > 100 ? "down" : "neutral"} />
                      <Metric label="Lang" value={r.primary_language || "—"} tone="accent" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}


