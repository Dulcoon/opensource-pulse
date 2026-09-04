import * as React from "react";
import { HelpCircle, Calculator, Sparkles, Layers, Activity } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VelocityScoreExplainerProps {
  score?: number;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function VelocityScoreExplainer({
  score,
  trigger,
  align = "end",
}: VelocityScoreExplainerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-accent cursor-pointer transition-colors group"
            title="Click to view Velocity Score calculation formula"
          >
            <span>Velocity Score</span>
            <HelpCircle className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        side="bottom"
        sideOffset={6}
        className="w-80 sm:w-96 p-4 bg-card/95 backdrop-blur-md border border-border shadow-xl font-mono text-xs space-y-3 z-50 rounded-sm"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-xs bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <Calculator className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-[12px] tracking-tight flex items-center gap-1.5">
                <span>Velocity Score Algorithm</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-normal">
                Transparent Empirical Formulation
              </div>
            </div>
          </div>
          {score !== undefined && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block text-[9px] uppercase">
                Current
              </span>
              <span className="text-[12px] font-bold text-accent">
                {score}/100
              </span>
            </div>
          )}
        </div>

        {/* Narrative Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
          A composite momentum index (0–100) that quantifies technology traction and community adoption speed over a rolling 7-day snapshot window.
        </p>

        {/* Formula Box */}
        <div className="space-y-2 bg-background/80 p-2.5 rounded-xs border border-border/70 text-[11px]">
          <div className="flex items-center justify-between text-[10px] font-semibold text-accent uppercase tracking-wider">
            <span>Mathematical Weights</span>
            <span className="text-muted-foreground font-normal">Sum = 100%</span>
          </div>

          <div className="space-y-2 pt-1 divide-y divide-border/40">
            {/* Pillar 1 */}
            <div className="space-y-0.5 pt-1">
              <div className="flex items-center justify-between text-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <span>50% Viral Inflow (7D Star Delta)</span>
                </span>
                <span className="text-emerald-400 font-bold">Max 50 pts</span>
              </div>
              <p className="text-[10px] text-muted-foreground pl-4 leading-tight">
                Normalized net-new GitHub stars accumulated across tracked repositories in the past 7 days.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-0.5 pt-1.5">
              <div className="flex items-center justify-between text-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-sky-400" />
                  <span>30% Relative Growth Rate</span>
                </span>
                <span className="text-sky-400 font-bold">Max 30 pts</span>
              </div>
              <p className="text-[10px] text-muted-foreground pl-4 leading-tight">
                Percentage expansion velocity relative to historical baseline, highlighting breakout emerging tech.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-0.5 pt-1.5">
              <div className="flex items-center justify-between text-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-amber-400" />
                  <span>20% Ecosystem Breadth</span>
                </span>
                <span className="text-amber-400 font-bold">Max 20 pts</span>
              </div>
              <p className="text-[10px] text-muted-foreground pl-4 leading-tight">
                Count of distinct production repositories actively utilizing or tagging this technology.
              </p>
            </div>
          </div>
        </div>

        {/* Quadrant Cutoffs */}
        <div className="text-[10px] space-y-1.5 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="uppercase tracking-wider text-[9px] font-semibold">
              Quadrant Threshold Cutoffs
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-foreground">Exploding:</span>
              <span className="text-muted-foreground">≥70 or +20%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="text-foreground">Rising:</span>
              <span className="text-muted-foreground">≥45 or +10%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-foreground">Stable:</span>
              <span className="text-muted-foreground">≥20 pts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="text-foreground">Declining:</span>
              <span className="text-muted-foreground">&lt;20 pts</span>
            </div>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="text-[9px] text-muted-foreground/70 bg-secondary/40 p-1.5 rounded-xs text-center border border-border/40">
          Recalibrated autonomously every 7-day synchronization cycle.
        </div>
      </PopoverContent>
    </Popover>
  );
}
