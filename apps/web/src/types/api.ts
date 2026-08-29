export interface Repository {
  id: number;
  github_id: number;
  owner: string;
  repository_name: string;
  full_name: string;
  description: string | null;
  primary_language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  repository_url: string | null;
  default_branch: string | null;
  last_release_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepositorySnapshot {
  id: number;
  repository_id: number;
  stars: number;
  forks: number;
  open_issues: number;
  contributors: number;
  captured_at: string;
}

export interface RepositorySummary {
  id: number;
  repository_id: number;
  quick_summary: string | null;
  key_features: string[] | null;
  use_cases: string[] | null;
  similar_projects: string[] | null;
  difficulty_level: string | null;
  model_name: string | null;
  generated_at: string | null;
}

export interface RepositoryHealthScore {
  id: number;
  repository_id: number;
  overall_score: number | null;
  activity_score: number | null;
  maintenance_score: number | null;
  community_score: number | null;
  issue_score: number | null;
  status: string | null;
  calculated_at: string | null;
}

export interface RepositoryDetailResponse {
  repository: Repository;
  summary: RepositorySummary | null;
  health_score: RepositoryHealthScore | null;
}

export interface TechnologyScore {
  id: number;
  technology_id: number;
  score: number | null;
  growth_percentage: number | null;
  status: string | null;
  repository_count: number | null;
  calculated_at: string | null;
}

export interface WeeklyReport {
  id: number;
  title: string;
  report_content: string | null;
  top_technologies: any;
  top_repositories: any;
  generated_at: string;
}

export interface DailyInsight {
  id: number;
  insight_text: string;
  generated_at: string;
}

export interface FastestGrowingRepo {
  id: number;
  full_name: string;
  stars: number;
  growth: number;
}

export interface WeeklyStats {
  total_repos: number;
  total_stars: number;
  active_languages: number;
  active_technologies: number;
}

export interface DashboardResponse {
  hot_technologies: TechnologyScore[];
  fastest_growing_repo: FastestGrowingRepo | null;
  emerging_technologies: TechnologyScore[];
  weekly_statistics: WeeklyStats | null;
  weekly_insight: DailyInsight | null;
}

export interface LanguageStat {
  language: string;
  total_stars: number;
  repo_count: number;
}

export interface TechTrendStat {
  month: string;
  tech_name: string;
  avg_score: number;
  repo_count: number;
}

export interface RepoGrowthStat {
  month: string;
  total_stars: number;
  total_forks: number;
  repo_count: number;
}

export interface ContributorStat {
  month: string;
  total_contributors: number;
  repo_count: number;
}

export interface AnalyticsResponse {
  language_growth: LanguageStat[];
  technology_growth: TechTrendStat[];
  repository_growth: RepoGrowthStat[];
  contributor_trend: ContributorStat[];
}
