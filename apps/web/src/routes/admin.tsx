import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  triggerSyncRepositories,
  triggerCalculateRadar,
  triggerGenerateInsight,
  triggerGenerateReport,
  checkSystemHealth,
} from "@/services/admin";
import {
  login,
  saveAuthSession,
  getStoredAuthSession,
  clearAuthSession,
  type AuthUser,
} from "@/services/auth";
import {
  RefreshCw,
  Radar,
  Sparkles,
  FileText,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Trash2,
  Server,
  Zap,
  Lock,
  UserCheck,
  LogOut,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Database,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Operations Center — OpenSource Pulse" },
      { name: "description", content: "Dedicated operations and background scheduler control room." },
    ],
  }),
  component: AdminPage,
});

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error" | "pending";
  action: string;
  message: string;
}

function AdminPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Login form state
  const [email, setEmail] = useState("admin@pulse.com");
  const [password, setPassword] = useState("admin123");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Console & actions state
  const [health, setHealth] = useState<{ status: string; url: string }>({ status: "checking", url: "" });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      action: "SYSTEM",
      message: "Dedicated operations center initialized. Ready for operations.",
    },
  ]);

  useEffect(() => {
    const session = getStoredAuthSession();
    if (session.token && session.user) {
      setCurrentUser(session.user);
    }
    setIsAuthLoading(false);
    checkHealth();
  }, []);

  const addLog = (type: LogEntry["type"], action: string, message: string) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      action,
      message,
    };
    setLogs((prev) => [entry, ...prev]);
  };

  const checkHealth = async () => {
    setHealth({ status: "checking", url: "" });
    const res = await checkSystemHealth();
    setHealth(res);
    addLog(
      res.status === "ok" ? "success" : "error",
      "HEALTHCHECK",
      res.status === "ok" ? `Backend API reachable at ${res.url}` : `Backend API unreachable at ${res.url}`,
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await login(email, password);
      saveAuthSession(res.token, res.user);
      setCurrentUser(res.user);
      addLog("success", "AUTH_LOGIN", `Authenticated as ${res.user.email} (${res.user.role})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password";
      setLoginError(msg);
      addLog("error", "AUTH_LOGIN", `Authentication failed: ${msg}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    addLog("info", "AUTH_LOGOUT", "User logged out successfully.");
  };

  const handleAction = async (
    name: string,
    actionKey: string,
    fn: () => Promise<{ message?: string; [key: string]: unknown }>,
  ) => {
    if (loadingAction) return;
    setLoadingAction(actionKey);
    addLog("pending", name, "Job triggered, awaiting backend response...");

    const startTime = Date.now();
    try {
      const res = await fn();
      const duration = Date.now() - startTime;
      const msg = res?.message || (res?.id ? `Created record ID #${res.id}` : "Executed successfully");
      addLog("success", name, `${msg} (${duration}ms)`);
    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      addLog("error", name, `Failed: ${errorMsg} (${duration}ms)`);
    } finally {
      setLoadingAction(null);
    }
  };

  const clearLogs = () => {
    setLogs([
      {
        id: "cleared",
        timestamp: new Date().toLocaleTimeString(),
        type: "info",
        action: "CONSOLE",
        message: "Activity log cleared.",
      },
    ]);
  };

  const operations = [
    {
      id: "sync",
      title: "1. GitHub Repository Sync",
      badge: "INGESTION",
      badgeColor: "text-accent bg-accent/10 border-accent/30",
      icon: RefreshCw,
      description:
        "Crawl trending GitHub repositories (stars > 1000, AI/agent topics), save timeseries snapshots, extract technologies, and auto-queue AI summaries.",
      btnText: "Sync Repositories Now",
      endpoint: "POST /api/sync/repositories",
      action: () => handleAction("SYNC_REPOSITORIES", "sync", triggerSyncRepositories),
      exploreLink: "/repositories",
      exploreText: "View Repositories",
    },
    {
      id: "radar",
      title: "2. Recalculate Tech Radar",
      badge: "ALGORITHMS",
      badgeColor: "text-success bg-success/10 border-success/30",
      icon: Radar,
      description:
        "Calculate technology adoption scores (50% repo weight + 50% stars) and 30-day historical growth rate to classify status (Exploding/Rising/Stable/Declining).",
      btnText: "Recalculate Radar Scores",
      endpoint: "POST /api/radar/calculate",
      action: () => handleAction("CALCULATE_RADAR", "radar", triggerCalculateRadar),
      exploreLink: "/radar",
      exploreText: "View Tech Radar",
    },
    {
      id: "insight",
      title: "3. Generate Daily Insight",
      badge: "AI ENGINE",
      badgeColor: "text-warning bg-warning/10 border-warning/30",
      icon: Sparkles,
      description:
        "Prompt LLM (Gemini / OpenRouter) with today's top 5 repositories and radar scores to synthesize a concise market insight in Indonesian.",
      btnText: "Generate Today's Insight",
      endpoint: "POST /api/reports/generate-insight",
      action: () => handleAction("GENERATE_INSIGHT", "insight", triggerGenerateInsight),
      exploreLink: "/",
      exploreText: "View on Terminal",
    },
    {
      id: "report",
      title: "4. Generate Weekly Report",
      badge: "AI REPORTING",
      badgeColor: "text-signal bg-signal/10 border-signal/30",
      icon: FileText,
      description:
        "Synthesize a 4-paragraph comprehensive intelligence report analyzing ecosystem movements, notable repositories, and next-week projections.",
      btnText: "Generate Weekly Report",
      endpoint: "POST /api/reports/generate",
      action: () => handleAction("GENERATE_REPORT", "report", triggerGenerateReport),
      exploreLink: "/reports",
      exploreText: "View Reports",
    },
  ];

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" />
          <span>Verifying security session...</span>
        </div>
      </div>
    );
  }

  // DEDICATED FULL-SCREEN UNAUTHENTICATED LOGIN GATEWAY
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 md:p-8">
        {/* Top Header */}
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Back to Public Terminal</span>
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            OpenSource Pulse // OSINT Control
          </div>
        </header>

        {/* Centered Login Card */}
        <main className="flex items-center justify-center my-8">
          <div className="w-full max-w-md rounded-sm border border-border bg-card p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="h-10 w-10 rounded-sm bg-accent flex items-center justify-center text-background font-bold">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">RESTRICTED ACCESS</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-warning pulse-dot" />
                </div>
                <h1 className="text-[16px] font-semibold tracking-tight text-foreground">Admin Operations Gateway</h1>
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground leading-relaxed mb-6 font-mono">
              Please authenticate with administrator credentials to manage background crawlers, calculations, and AI pipelines.
            </p>

            {loginError && (
              <div className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2 text-destructive text-[11px] font-mono">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@pulse.com"
                  className="w-full h-9 rounded-sm border border-border bg-background px-3 text-[12px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-9 rounded-sm border border-border bg-background px-3 text-[12px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Quick Demo Credentials Info */}
              <div className="rounded-sm border border-border/60 bg-secondary/30 p-2.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[9px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> Default Seeder Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@pulse.com");
                      setPassword("admin123");
                    }}
                    className="text-[9px] text-accent hover:underline uppercase"
                  >
                    Auto-fill
                  </button>
                </div>
                <div className="mt-1 text-foreground/80 flex items-center justify-between text-[10px]">
                  <span>admin@pulse.com</span>
                  <span className="text-muted-foreground">/</span>
                  <span>admin123</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-9 mt-2 inline-flex items-center justify-center gap-2 rounded-sm bg-accent text-accent-foreground font-mono text-[12px] font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Operations Center</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        <footer className="text-center text-[10px] font-mono text-muted-foreground/60">
          OpenSource Pulse Autonomous Agent Network · Enterprise Operations
        </footer>
      </div>
    );
  }

  // DEDICATED FULL-PAGE AUTHENTICATED ADMIN OPERATIONS CENTER
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Dedicated Admin Navbar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-sm bg-accent flex items-center justify-center text-background font-bold">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold tracking-tight text-foreground">OpenSource Pulse</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent/20 text-accent uppercase font-semibold">
                ADMIN OPS
              </span>
            </div>
            <div className="text-[9px] font-mono text-muted-foreground tracking-wider">
              Autonomous Intelligence Engine Control
            </div>
          </div>
        </div>

        {/* System Telemetry Chips (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary/40">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health.status === "ok" ? "bg-success pulse-dot" : "bg-destructive"
              }`}
            />
            <span>API: {health.status === "ok" ? "ONLINE (9001)" : "OFFLINE"}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary/40">
            <Zap className="h-3 w-3 text-accent" />
            <span>Asynq Redis</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary/40">
            <Cpu className="h-3 w-3 text-success" />
            <span>Gemini + OpenRouter</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-secondary/60 hover:bg-secondary text-foreground hover:text-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Public Terminal</span>
          </Link>

          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-sm">
            <UserCheck className="h-3.5 w-3.5 text-accent" />
            <span className="text-foreground font-medium truncate max-w-[140px]">
              {currentUser.name || currentUser.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Operations Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
              Operations & Crawling Command Center
            </h2>
            <p className="text-[12px] font-mono text-muted-foreground mt-0.5">
              Execute on-demand repository ingestion, tech radar calculations, and AI intelligence synthesis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkHealth}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono border border-border bg-card px-3 py-1.5 rounded-sm hover:bg-secondary text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-accent" />
              <span>Ping Cluster</span>
            </button>
          </div>
        </div>

        {/* Operation Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operations.map((op) => {
            const Icon = op.icon;
            const isLoading = loadingAction === op.id;

            return (
              <div
                key={op.id}
                className="rounded-sm border border-border bg-card p-5 flex flex-col justify-between hover:border-border/80 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-foreground">
                        <Icon className={`h-4 w-4 ${isLoading ? "animate-spin text-accent" : ""}`} />
                      </div>
                      <h3 className="text-[13px] font-semibold text-foreground tracking-tight">{op.title}</h3>
                    </div>
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${op.badgeColor}`}>
                      {op.badge}
                    </span>
                  </div>

                  <p className="text-[12px] text-muted-foreground leading-relaxed mt-2.5 mb-3">{op.description}</p>
                  <div className="text-[10px] font-mono text-muted-foreground/80 bg-background/60 px-2 py-1 rounded border border-border/50 mb-4 inline-block">
                    {op.endpoint}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <button
                    onClick={op.action}
                    disabled={Boolean(loadingAction)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] font-mono font-medium transition-all ${
                      isLoading
                        ? "bg-accent/20 text-accent cursor-wait"
                        : loadingAction
                        ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                        : "bg-accent text-accent-foreground hover:opacity-90 active:scale-[0.99]"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>{isLoading ? "Executing..." : op.btnText}</span>
                  </button>

                  <Link
                    to={op.exploreLink}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors"
                  >
                    <span>{op.exploreText}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Execution Activity Console */}
        <div className="rounded-sm border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-accent" />
              <h3 className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground font-semibold">
                Live Operation Console & Logs
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">({logs.length} events)</span>
            </div>

            <button
              onClick={clearLogs}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-transparent hover:border-border transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Console</span>
            </button>
          </div>

          <div className="p-4 bg-background font-mono text-[11px] max-h-64 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-0.5 hover:bg-card/40 px-1 rounded">
                <span className="text-muted-foreground/70 shrink-0 text-[10px] pt-0.5">{log.timestamp}</span>

                <span
                  className={`shrink-0 text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                    log.type === "success"
                      ? "bg-success/20 text-success border border-success/30"
                      : log.type === "error"
                      ? "bg-destructive/20 text-destructive border border-destructive/30"
                      : log.type === "pending"
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {log.action}
                </span>

                <div className="flex-1 flex items-center gap-1.5">
                  {log.type === "success" && <CheckCircle2 className="h-3 w-3 text-success shrink-0" />}
                  {log.type === "error" && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
                  {log.type === "pending" && <RefreshCw className="h-3 w-3 text-accent animate-spin shrink-0" />}
                  {log.type === "info" && <Activity className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className={log.type === "error" ? "text-destructive" : "text-foreground/90"}>
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Automation Reference Table */}
        <div className="rounded-sm border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground font-semibold">
              Automated Background Scheduler Schedule (Asynq Cron)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] font-mono">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/20">
                <tr>
                  <th className="text-left px-3 py-2">Job Task</th>
                  <th className="text-left px-3 py-2">Cron Schedule</th>
                  <th className="text-left px-3 py-2">Frequency</th>
                  <th className="text-left px-3 py-2">Target Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="px-3 py-2 text-accent font-medium">sync:repositories</td>
                  <td className="px-3 py-2 text-muted-foreground">@every 6h</td>
                  <td className="px-3 py-2">Every 6 Hours</td>
                  <td className="px-3 py-2 text-foreground/80">Fetches top trending GitHub repos & records timeseries snapshots</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-accent font-medium">health:calculate</td>
                  <td className="px-3 py-2 text-muted-foreground">0 2 * * *</td>
                  <td className="px-3 py-2">Daily at 02:00 AM</td>
                  <td className="px-3 py-2 text-foreground/80">Recalculates 4-pillar health score for all tracked repositories</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-accent font-medium">radar:calculate</td>
                  <td className="px-3 py-2 text-muted-foreground">0 3 * * *</td>
                  <td className="px-3 py-2">Daily at 03:00 AM</td>
                  <td className="px-3 py-2 text-foreground/80">Computes 30-day technology growth & quadrant classification</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-accent font-medium">insight:generate</td>
                  <td className="px-3 py-2 text-muted-foreground">0 8 * * *</td>
                  <td className="px-3 py-2">Daily at 08:00 AM</td>
                  <td className="px-3 py-2 text-foreground/80">Synthesizes LLM daily insight paragraph for homepage terminal</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-accent font-medium">report:generate</td>
                  <td className="px-3 py-2 text-muted-foreground">0 9 * * 1</td>
                  <td className="px-3 py-2">Mondays at 09:00 AM</td>
                  <td className="px-3 py-2 text-foreground/80">Generates comprehensive weekly AI intelligence ecosystem report</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
