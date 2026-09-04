import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Star,
  GitFork,
  AlertCircle,
  Sparkles,
  Check,
  Activity,
  ArrowRight,
  ShieldCheck,
  Flame,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useRepositoryByOwner } from "@/hooks/use-repositories";

interface RepoPeekDrawerProps {
  owner: string | null;
  repo: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RepoPeekDrawer({ owner, repo, isOpen, onClose }: RepoPeekDrawerProps) {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const { data: detail, isLoading } = useRepositoryByOwner(owner || "", repo || "");

  const r = detail?.repository;
  const summary = detail?.summary;
  const health = detail?.health_score;

  const keyFeatures = summary?.key_features
    ? Array.isArray(summary.key_features)
      ? summary.key_features
      : []
    : [];

  const useCases = summary?.use_cases
    ? Array.isArray(summary.use_cases)
      ? summary.use_cases
      : []
    : [];

  return (
    <AnimatePresence>
      {isOpen && owner && repo && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-over Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-background/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
                  Quick Intelligence Peek
                </span>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 inline-flex items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground font-mono text-[12px] space-y-3">
                  <div className="inline-block h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p>Synthesizing repository telemetry & AI audit...</p>
                </div>
              ) : !r ? (
                <div className="py-20 text-center text-muted-foreground font-mono text-[12px]">
                  Unable to load repository intelligence dossier.
                </div>
              ) : (
                <>
                  {/* Repo Brand Bar */}
                  <div className="flex items-start gap-4">
                    <img
                      src={`https://github.com/${r.owner}.png?size=96`}
                      alt={r.owner}
                      className="h-14 w-14 rounded-sm border border-border bg-background shrink-0 object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                        {r.owner}
                      </div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight truncate">
                        {r.repository_name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-xs border border-border px-1.5 py-0.5 text-[10px] font-mono uppercase text-foreground/80 bg-background/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {r.primary_language || "Universal"}
                        </span>
                        {health && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                              health.status === "Excellent"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : health.status === "Good"
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            <Activity className="h-2.5 w-2.5" />
                            Health: {Math.round(health.overall_score ?? 0)}/100 · {health.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Link
                      to="/repositories/$owner/$repo"
                      params={{ owner: r.owner, repo: r.repository_name }}
                      onClick={onClose}
                      className="h-9 rounded-sm bg-foreground text-background font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-foreground/90 transition-colors cursor-pointer"
                    >
                      <span>Open Full Dossier</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <a
                      href={r.repository_url || `https://github.com/${r.owner}/${r.repository_name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 rounded-sm border border-border bg-card text-foreground font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:border-accent/60 transition-colors cursor-pointer"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  </div>

                  {/* Description */}
                  <div className="rounded-sm border border-border bg-background/40 p-3.5 text-[13px] text-muted-foreground leading-relaxed">
                    {r.description || "No public description provided."}
                  </div>

                  {/* Quick Metric Strip */}
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="rounded-sm border border-border bg-card p-3 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 text-emerald-400" /> Stars
                      </span>
                      <span className="mt-1 text-base font-bold text-foreground tabular">
                        {r.stars.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-sm border border-border bg-card p-3 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <GitFork className="h-3 w-3 text-sky-400" /> Forks
                      </span>
                      <span className="mt-1 text-base font-bold text-foreground tabular">
                        {r.forks.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-sm border border-border bg-card p-3 flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-400" /> Issues
                      </span>
                      <span className="mt-1 text-base font-bold text-foreground tabular">
                        {r.open_issues.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* AI Intelligence Summary (Gemini Powered) */}
                  <div className="rounded-sm border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> AI Executive Summary
                      </span>
                      {summary?.difficulty_level && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                          {summary.difficulty_level}
                        </span>
                      )}
                    </div>

                    {summary?.quick_summary ? (
                      <p className="text-[12px] text-muted-foreground leading-relaxed font-sans">
                        {summary.quick_summary}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        AI summary is being indexed for this repository.
                      </p>
                    )}

                    {/* Key Features */}
                    {keyFeatures.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground font-semibold block">
                          Key Architecture Highlights
                        </span>
                        <ul className="space-y-1.5">
                          {keyFeatures.slice(0, 4).map((feat, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Use Cases */}
                    {useCases.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground font-semibold block">
                          Target Use Cases
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {useCases.slice(0, 4).map((uc, i) => (
                            <div
                              key={i}
                              className="rounded-xs border border-border/70 bg-background/50 p-2 text-[11px] text-muted-foreground"
                            >
                              {uc}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Health Breakdown Strip */}
                  {health && (
                    <div className="rounded-sm border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/70 pb-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-emerald-400" /> Maintainer Cadence & Health
                        </span>
                        <span className="text-[11px] font-mono font-bold text-foreground">
                          {Math.round(health.overall_score ?? 0)}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                        <div>
                          <div className="flex justify-between text-muted-foreground text-[10px] mb-1">
                            <span>Activity</span>
                            <span>{Math.round(health.activity_score ?? 0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${Math.round(health.activity_score ?? 0)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-muted-foreground text-[10px] mb-1">
                            <span>Maintenance</span>
                            <span>{Math.round(health.maintenance_score ?? 0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-sky-400 rounded-full"
                              style={{ width: `${Math.round(health.maintenance_score ?? 0)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-muted-foreground text-[10px] mb-1">
                            <span>Community</span>
                            <span>{Math.round(health.community_score ?? 0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.round(health.community_score ?? 0)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-muted-foreground text-[10px] mb-1">
                            <span>Issue Velocity</span>
                            <span>{Math.round(health.issue_score ?? 0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${Math.round(health.issue_score ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            {r && (
              <div className="p-4 border-t border-border bg-background/80 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground">
                  OpenSource Pulse Intelligence Pipeline
                </span>
                <Link
                  to="/repositories/$owner/$repo"
                  params={{ owner: r.owner, repo: r.repository_name }}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-accent hover:underline font-semibold cursor-pointer"
                >
                  <span>Full Comprehensive Report</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
