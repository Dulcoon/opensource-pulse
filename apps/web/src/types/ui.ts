export type RadarStatus = "Exploding" | "Rising" | "Stable" | "Declining";

export type RepoSignal = "Strong Bullish" | "Bullish" | "Neutral" | "Bearish";

export type FeedKind = "signal" | "alert" | "report" | "movement";

export interface RadarTech {
  name: string;
  quadrant: RadarStatus;
  score: number;
  growth: number;
  repos: number;
}

export interface HeatmapItem {
  name: string;
  weight: number;
  growth: number;
  status: RadarStatus;
}

export interface TickerItem {
  sym: string;
  val: string;
  up: boolean;
}

export interface FeedItem {
  time: string;
  kind: FeedKind;
  tag: string;
  text: string;
}

export interface AnalystReport {
  signal: string;
  observation: string;
  risk: string;
  outlook: string;
}

export interface RepoCardData {
  owner: string;
  name: string;
  stars: number;
  growth: number;
  lang: string;
  description: string;
  trend: number;
  health: number;
  signal: RepoSignal;
  confidence: number;
  category: string;
}

export interface WeeklyStatDisplay {
  label: string;
  value: string;
  delta: string;
}

export interface ReportItem {
  id: string;
  title: string;
  date: string;
  topTech: string;
  movers: string;
}

export interface AnalyticsSeriesItem {
  month: string;
  typescript: number;
  python: number;
  rust: number;
  go: number;
}
