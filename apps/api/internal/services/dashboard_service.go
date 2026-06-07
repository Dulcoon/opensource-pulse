package services

import (
	"context"

	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/domain/report"
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

type DashboardResponse struct {
	HotTechnologies   []technology.TechnologyScore `json:"hot_technologies"`
	WeeklyInsight     *report.DailyInsight          `json:"weekly_insight"`
}

func (s *DashboardService) GetDashboard(ctx context.Context) (*DashboardResponse, error) {
	scores, err := s.techRepo.FindLatestScores(ctx)
	if err != nil {
		return nil, err
	}

	insight, _ := s.reportRepo.FindLatestInsight(ctx)

	return &DashboardResponse{
		HotTechnologies: scores,
		WeeklyInsight:   insight,
	}, nil
}