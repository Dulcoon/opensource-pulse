package services

import (
	"context"

	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/repositories"
)

type RepositoryService struct {
	repoRepo *repositories.RepositoryRepo
}

func NewRepositoryService(repoRepo *repositories.RepositoryRepo) *RepositoryService {
	return &RepositoryService{repoRepo: repoRepo}
}

type RepositoryDetailResponse struct {
	Repository  repository.Repository           `json:"repository"`
	Summary     *repository.RepositorySummary   `json:"summary,omitempty"`
	HealthScore *repository.RepositoryHealthScore `json:"health_score"`
}

func (s *RepositoryService) ListRepositories(ctx context.Context, query, language string) ([]repository.Repository, error) {
	return s.repoRepo.Search(ctx, query, language)
}

func (s *RepositoryService) GetRepository(ctx context.Context, id uint) (*RepositoryDetailResponse, error) {
	repo, err := s.repoRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	summary, _ := s.repoRepo.FindSummaryByRepoID(ctx, id)
	health, _ := s.repoRepo.FindHealthScoreByRepoID(ctx, id)

	return &RepositoryDetailResponse{
		Repository:  *repo,
		Summary:     summary,
		HealthScore: health,
	}, nil
}

func (s *RepositoryService) GetSummary(ctx context.Context, id uint) (*repository.RepositorySummary, error) {
	return s.repoRepo.FindSummaryByRepoID(ctx, id)
}