export type RadarStatus = "Exploding" | "Rising" | "Stable" | "Declining";

export const hotTechnologies = [
  { name: "AI Agents", growth: 42, status: "Exploding" as RadarStatus, repos: 184 },
  { name: "MCP Servers", growth: 38, status: "Exploding" as RadarStatus, repos: 142 },
  { name: "Rust WASM", growth: 28, status: "Rising" as RadarStatus, repos: 96 },
  { name: "LLM Inference", growth: 24, status: "Rising" as RadarStatus, repos: 142 },
  { name: "Vector DBs", growth: 19, status: "Rising" as RadarStatus, repos: 73 },
  { name: "Edge Runtime", growth: 15, status: "Stable" as RadarStatus, repos: 58 },
];

export type RepoSignal = "Strong Bullish" | "Bullish" | "Neutral" | "Bearish";

export const fastestRepos = [
  { owner: "anthropics", name: "claude-code", stars: 28400, growth: 312, lang: "TypeScript", description: "Agentic coding tool that lives in your terminal.", trend: 96, health: 91, signal: "Strong Bullish" as RepoSignal, confidence: 94, category: "AI Agents" },
  { owner: "vercel", name: "ai", stars: 14800, growth: 96, lang: "TypeScript", description: "Build AI-powered applications with React, Svelte, Vue.", trend: 88, health: 89, signal: "Bullish" as RepoSignal, confidence: 86, category: "LLM Framework" },
  { owner: "modular", name: "mojo", stars: 23700, growth: 84, lang: "Mojo", description: "The Mojo programming language for AI developers.", trend: 84, health: 82, signal: "Bullish" as RepoSignal, confidence: 78, category: "Language" },
  { owner: "tursodatabase", name: "limbo", stars: 9200, growth: 67, lang: "Rust", description: "A rewrite of SQLite in Rust, async-first.", trend: 79, health: 85, signal: "Bullish" as RepoSignal, confidence: 81, category: "Database" },
  { owner: "ggerganov", name: "llama.cpp", stars: 71200, growth: 41, lang: "C++", description: "LLM inference in C/C++ with no dependencies.", trend: 92, health: 94, signal: "Strong Bullish" as RepoSignal, confidence: 96, category: "LLM Inference" },
  { owner: "huggingface", name: "smolagents", stars: 8400, growth: 38, lang: "Python", description: "A barebones library for agents that think in code.", trend: 74, health: 80, signal: "Bullish" as RepoSignal, confidence: 76, category: "AI Agents" },
];

export const emergingTech = [
  { name: "MCP Servers", growth: 380, repos: 142 },
  { name: "Agentic Memory", growth: 220, repos: 67 },
  { name: "Local LLMs", growth: 156, repos: 89 },
  { name: "Voice Agents", growth: 134, repos: 45 },
  { name: "RAG Frameworks", growth: 98, repos: 173 },
];

export const weeklyStats = [
  { label: "Repositories Tracked", value: "18,241", delta: "+4.2%" },
  { label: "Technologies Monitored", value: "234", delta: "+12" },
  { label: "Stars Added (7d)", value: "284K", delta: "+12.1%" },
  { label: "Active Signals", value: "47", delta: "+9" },
];

/* Market heatmap: weight drives bar length */
export const heatmap = [
  { name: "AI Agents", weight: 98, growth: 42, status: "Exploding" as RadarStatus },
  { name: "MCP", weight: 92, growth: 380, status: "Exploding" as RadarStatus },
  { name: "Browser AI", weight: 78, growth: 64, status: "Rising" as RadarStatus },
  { name: "Rust", weight: 70, growth: 28, status: "Rising" as RadarStatus },
  { name: "Vector DBs", weight: 62, growth: 19, status: "Rising" as RadarStatus },
  { name: "React", weight: 54, growth: 6, status: "Stable" as RadarStatus },
  { name: "Vue", weight: 38, growth: 3, status: "Stable" as RadarStatus },
  { name: "Angular", weight: 22, growth: -4, status: "Declining" as RadarStatus },
  { name: "jQuery", weight: 8, growth: -22, status: "Declining" as RadarStatus },
];

/* Live intelligence feed */
export type FeedKind = "signal" | "alert" | "report" | "movement";
export const intelligenceFeed: { time: string; kind: FeedKind; tag: string; text: string }[] = [
  { time: "09:14", kind: "signal",   tag: "AI Agents",   text: "AI Agents surpassed Rust repositories in weekly star growth." },
  { time: "09:02", kind: "movement", tag: "MCP",         text: "MCP server registrations up 18% in the last 24 hours." },
  { time: "08:47", kind: "alert",    tag: "Browser AI",  text: "Browser-resident AI repos crossed 500 active projects." },
  { time: "08:31", kind: "report",   tag: "Claude Code", text: "anthropics/claude-code added 6.4k stars this week." },
  { time: "08:12", kind: "movement", tag: "Limbo",       text: "tursodatabase/limbo entered the Top 50 trending Rust repos." },
  { time: "07:54", kind: "signal",   tag: "Mojo",        text: "Mojo commit cadence accelerated 2.1x quarter-over-quarter." },
  { time: "07:33", kind: "alert",    tag: "REST APIs",   text: "Traditional REST framework activity continues to decline." },
  { time: "07:08", kind: "report",   tag: "Pulse AI",    text: "Weekly intelligence report ready for review." },
];

export const analystReport = {
  signal: "Strong AI Agent Expansion",
  observation:
    "MCP adoption is compounding week-over-week. Agent runtimes are consolidating around 3–4 reference implementations, and terminal-native tooling is replacing IDE plugins as the default form factor.",
  risk:
    "Market saturation risk is growing as undifferentiated agent wrappers flood the ecosystem. Expect a discoverability collapse and a flight to brand within 60 days.",
  outlook:
    "Positive momentum expected through Q3. Watch for an inflection in Browser AI as runtimes mature and shipping costs approach zero.",
};

export const starsGrowthSeries = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  stars: Math.round(800 + Math.sin(i / 3) * 200 + i * 45 + Math.random() * 100),
  forks: Math.round(120 + Math.cos(i / 4) * 30 + i * 6 + Math.random() * 20),
}));

export type RadarTech = {
  name: string;
  quadrant: "Exploding" | "Rising" | "Stable" | "Declining";
  score: number;
  growth: number;
  repos: number;
};

export const radarTech: RadarTech[] = [
  { name: "AI Agents", quadrant: "Exploding", score: 98, growth: 42, repos: 184 },
  { name: "MCP Servers", quadrant: "Exploding", score: 94, growth: 380, repos: 142 },
  { name: "Browser AI", quadrant: "Exploding", score: 88, growth: 64, repos: 96 },
  { name: "Rust WASM", quadrant: "Rising", score: 82, growth: 28, repos: 96 },
  { name: "LLM Inference", quadrant: "Rising", score: 79, growth: 24, repos: 142 },
  { name: "Vector DBs", quadrant: "Rising", score: 71, growth: 19, repos: 73 },
  { name: "Edge Runtime", quadrant: "Stable", score: 64, growth: 15, repos: 58 },
  { name: "GraphQL Federation", quadrant: "Stable", score: 58, growth: 4, repos: 41 },
  { name: "Kubernetes Operators", quadrant: "Stable", score: 55, growth: 2, repos: 88 },
  { name: "REST APIs", quadrant: "Declining", score: 38, growth: -6, repos: 220 },
  { name: "jQuery Plugins", quadrant: "Declining", score: 12, growth: -22, repos: 14 },
];

export const analyticsSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  typescript: 1200 + i * 80 + Math.round(Math.random() * 60),
  python: 1400 + i * 120 + Math.round(Math.random() * 80),
  rust: 600 + i * 90,
  go: 800 + i * 40,
}));

export const reports = [
  { id: "2026-w22", title: "Weekly Pulse — Week 22, 2026", date: "Jun 1, 2026", topTech: "AI Agents", movers: "MCP, Mojo, Limbo" },
  { id: "2026-w21", title: "Weekly Pulse — Week 21, 2026", date: "May 25, 2026", topTech: "MCP Servers", movers: "Claude Code, smolagents" },
  { id: "2026-w20", title: "Weekly Pulse — Week 20, 2026", date: "May 18, 2026", topTech: "Rust WASM", movers: "Limbo, Bun, Deno" },
  { id: "2026-w19", title: "Weekly Pulse — Week 19, 2026", date: "May 11, 2026", topTech: "Local LLMs", movers: "Ollama, llama.cpp" },
];

/* Ticker tape across the top of the app */
export const ticker = [
  { sym: "AI-AGENTS", val: "+42.0%", up: true },
  { sym: "MCP", val: "+380%", up: true },
  { sym: "BROWSER-AI", val: "+64.0%", up: true },
  { sym: "RUST-WASM", val: "+28.0%", up: true },
  { sym: "LLM-INF", val: "+24.0%", up: true },
  { sym: "VECTOR-DB", val: "+19.0%", up: true },
  { sym: "EDGE-RT", val: "+15.0%", up: true },
  { sym: "REACT", val: "+6.0%", up: true },
  { sym: "VUE", val: "+3.0%", up: true },
  { sym: "ANGULAR", val: "-4.0%", up: false },
  { sym: "REST", val: "-6.0%", up: false },
  { sym: "JQUERY", val: "-22.0%", up: false },
];
