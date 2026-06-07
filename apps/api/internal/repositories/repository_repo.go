package repositories

import (
	"context"
	"errors"

	"opensource-pulse/api/internal/domain/repository"
	"gorm.io/gorm"
)

type RepositoryRepo struct {
	db *gorm.DB
}

func NewRepositoryRepo(db *gorm.DB) *RepositoryRepo {
	return &RepositoryRepo{db: db}
}

func (r *RepositoryRepo) FindAll(ctx context.Context) ([]repository.Repository, error) {
	var repos []repository.Repository
	err := r.db.WithContext(ctx).Order("stars desc").Find(&repos).Error
	return repos, err
}

func (r *RepositoryRepo) FindByID(ctx context.Context, id uint) (*repository.Repository, error) {
	var repo repository.Repository
	err := r.db.WithContext(ctx).First(&repo, id).Error
	return &repo, err
}

func (r *RepositoryRepo) Search(ctx context.Context, query, language string) ([]repository.Repository, error) {
	var repos []repository.Repository
	tx := r.db.WithContext(ctx)
	if query != "" {
		tx = tx.Where("full_name ILIKE ?", "%"+query+"%")
	}
	if language != "" {
		tx = tx.Where("primary_language = ?", language)
	}
	err := tx.Order("stars desc").Find(&repos).Error
	return repos, err
}

func (r *RepositoryRepo) FindSummaryByRepoID(ctx context.Context, repoID uint) (*repository.RepositorySummary, error) {
	var summary repository.RepositorySummary
	err := r.db.WithContext(ctx).Where("repository_id = ?", repoID).First(&summary).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &summary, nil
}

func (r *RepositoryRepo) FindHealthScoreByRepoID(ctx context.Context, repoID uint) (*repository.RepositoryHealthScore, error) {
	var score repository.RepositoryHealthScore
	err := r.db.WithContext(ctx).Where("repository_id = ?", repoID).First(&score).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &score, nil
}