package services

import (
	"context"

	"opensource-pulse/api/internal/repositories"
)

type AnalyticsResponse struct {
	LanguageGrowth   []repositories.LanguageStat     `json:"language_growth"`
	TechnologyGrowth []repositories.TechTrendStat    `json:"technology_growth"`
	RepositoryGrowth []repositories.RepoGrowthStat   `json:"repository_growth"`
	ContributorTrend []repositories.ContributorStat  `json:"contributor_trend"`
}

type AnalyticsService struct {
	repoRepo *repositories.RepositoryRepo
	techRepo *repositories.TechnologyRepo
}

func NewAnalyticsService(repoRepo *repositories.RepositoryRepo, techRepo *repositories.TechnologyRepo) *AnalyticsService {
	return &AnalyticsService{repoRepo: repoRepo, techRepo: techRepo}
}

func (s *AnalyticsService) GetAnalytics(ctx context.Context) (*AnalyticsResponse, error) {
	langGrowth, err := s.repoRepo.FindLanguageGrowth(ctx)
	if err != nil {
		return nil, err
	}

	techGrowth, err := s.techRepo.FindTechnologyTrend(ctx)
	if err != nil {
		return nil, err
	}

	repoGrowth, err := s.repoRepo.FindRepoGrowth(ctx)
	if err != nil {
		return nil, err
	}

	contribTrend, err := s.repoRepo.FindContributorTrend(ctx)
	if err != nil {
		return nil, err
	}

	return &AnalyticsResponse{
		LanguageGrowth:   langGrowth,
		TechnologyGrowth: techGrowth,
		RepositoryGrowth: repoGrowth,
		ContributorTrend: contribTrend,
	}, nil
}
