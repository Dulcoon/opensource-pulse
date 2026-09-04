package services

import (
	"context"
	"sort"

	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"
)

type DashboardService struct {
	repoRepo   *repositories.RepositoryRepo
	techRepo   *repositories.TechnologyRepo
	reportRepo *repositories.ReportRepo
}

func NewDashboardService(repoRepo *repositories.RepositoryRepo, techRepo *repositories.TechnologyRepo, reportRepo *repositories.ReportRepo) *DashboardService {
	return &DashboardService{repoRepo: repoRepo, techRepo: techRepo, reportRepo: reportRepo}
}

type FastestGrowingRepo struct {
	ID              uint    `json:"id"`
	FullName        string  `json:"full_name"`
	Stars           int     `json:"stars"`
	Growth          int     `json:"growth"`
	PrimaryLanguage *string `json:"primary_language,omitempty"`
}

type WeeklyStats struct {
	TotalRepos         int64 `json:"total_repos"`
	TotalStars         int64 `json:"total_stars"`
	ActiveLanguages    int64 `json:"active_languages"`
	ActiveTechnologies int64 `json:"active_technologies"`
}

type DashboardResponse struct {
	HotTechnologies      []technology.TechnologyScore `json:"hot_technologies"`
	FastestGrowingRepo   *FastestGrowingRepo          `json:"fastest_growing_repo,omitempty"`
	FastestGrowingRepos  []FastestGrowingRepo         `json:"fastest_growing_repos,omitempty"`
	EmergingTechnologies []technology.TechnologyScore `json:"emerging_technologies,omitempty"`
	WeeklyStatistics     *WeeklyStats                 `json:"weekly_statistics,omitempty"`
	WeeklyInsight        *report.DailyInsight         `json:"weekly_insight"`
}

func (s *DashboardService) GetDashboard(ctx context.Context) (*DashboardResponse, error) {
	// Hot technologies
	scores, err := s.techRepo.FindLatestScores(ctx)
	if err != nil {
		return nil, err
	}

	// Emerging technologies (highest growth %)
	emerging, _ := s.techRepo.FindEmerging(ctx, 5)

	// Weekly insight
	insight, _ := s.reportRepo.FindLatestInsight(ctx)

	// Weekly statistics
	totalRepos, totalStars, distinctLangs, _ := s.repoRepo.CountStats(ctx)
	totalTechs, _ := s.techRepo.CountTechnologies(ctx)

	// Fastest growing repositories (top 5)
	fastestList := s.findFastestGrowingRepos(ctx, 5)
	var fastest *FastestGrowingRepo
	if len(fastestList) > 0 {
		fastest = &fastestList[0]
	}

	return &DashboardResponse{
		HotTechnologies:      scores,
		FastestGrowingRepo:   fastest,
		FastestGrowingRepos:  fastestList,
		EmergingTechnologies: emerging,
		WeeklyStatistics: &WeeklyStats{
			TotalRepos:         totalRepos,
			TotalStars:         totalStars,
			ActiveLanguages:    distinctLangs,
			ActiveTechnologies: totalTechs,
		},
		WeeklyInsight: insight,
	}, nil
}

func (s *DashboardService) findFastestGrowingRepos(ctx context.Context, limit int) []FastestGrowingRepo {
	topRepos, err := s.repoRepo.FindTopWithGrowth(ctx, 15)
	if err != nil || len(topRepos) == 0 {
		return nil
	}

	type growthInfo struct {
		repo   repository.Repository
		growth int
	}
	var candidates []growthInfo

	for _, r := range topRepos {
		snapshots, err := s.repoRepo.FindSnapshotsByRepoID(ctx, r.ID)
		if err != nil || len(snapshots) < 2 {
			candidates = append(candidates, growthInfo{repo: r, growth: 0})
			continue
		}
		latest := snapshots[0].Stars
		prev := snapshots[len(snapshots)-1].Stars
		candidates = append(candidates, growthInfo{repo: r, growth: latest - prev})
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].growth > candidates[j].growth
	})

	resultCount := limit
	if len(candidates) < resultCount {
		resultCount = len(candidates)
	}

	result := make([]FastestGrowingRepo, 0, resultCount)
	for i := 0; i < resultCount; i++ {
		c := candidates[i]
		result = append(result, FastestGrowingRepo{
			ID:              c.repo.ID,
			FullName:        c.repo.FullName,
			Stars:           c.repo.Stars,
			Growth:          c.growth,
			PrimaryLanguage: c.repo.PrimaryLanguage,
		})
	}

	return result
}