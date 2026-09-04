import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GitBranch,
  Radar,
  BarChart3,
  FileText,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Flame,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const navigate = useNavigate();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const runCommand = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command, module, or search..." />
      <CommandList className="font-mono text-xs">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Core Modules */}
        <CommandGroup heading="Modules">
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/" }))}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-accent" />
            <span>01 Terminal</span>
            <CommandShortcut>G then T</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/repositories" }))}
            className="cursor-pointer"
          >
            <GitBranch className="mr-2 h-4 w-4 text-sky-400" />
            <span>02 Repositories</span>
            <CommandShortcut>G then R</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/radar" }))}
            className="cursor-pointer"
          >
            <Radar className="mr-2 h-4 w-4 text-emerald-400" />
            <span>03 Tech Radar</span>
            <CommandShortcut>G then D</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/analytics" }))}
            className="cursor-pointer"
          >
            <BarChart3 className="mr-2 h-4 w-4 text-amber-400" />
            <span>04 Market Analytics</span>
            <CommandShortcut>G then A</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/reports" }))}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4 text-violet-400" />
            <span>05 Intelligence Reports</span>
            <CommandShortcut>G then P</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/admin" }))}
            className="cursor-pointer"
          >
            <ShieldAlert className="mr-2 h-4 w-4 text-rose-400" />
            <span>Admin Console</span>
            <CommandShortcut>G then S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Market Signals */}
        <CommandGroup heading="Market Signals & Sectors">
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/radar" }))}
            className="cursor-pointer"
          >
            <Flame className="mr-2 h-4 w-4 text-accent" />
            <span>Exploding Tech: AI & Agents</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/analytics" }))}
            className="cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Weekly Momentum Leaderboards</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
