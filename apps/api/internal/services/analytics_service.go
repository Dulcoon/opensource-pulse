package services

import (
	"context"

	"opensource-pulse/api/internal/repositories"
)

type AnalyticsService struct {
	repoRepo *repositories.RepositoryRepo
	techRepo *repositories.TechnologyRepo
}

func NewAnalyticsService(repoRepo *repositories.RepositoryRepo, techRepo *repositories.TechnologyRepo) *AnalyticsService {
	return &AnalyticsService{repoRepo: repoRepo, techRepo: techRepo}
}

func (s *AnalyticsService) GetAnalytics(ctx context.Context) map[string]interface{} {
	return map[string]interface{}{
		"message": "not implemented yet",
	}
}