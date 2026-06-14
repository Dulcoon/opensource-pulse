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

func (r *RepositoryRepo) FindByFullName(ctx context.Context, owner, repoName string) (*repository.Repository, error) {
	var repo repository.Repository
	err := r.db.WithContext(ctx).
		Where("owner = ? AND repository_name = ?", owner, repoName).
		First(&repo).Error
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

func (r *RepositoryRepo) FindSnapshotsByRepoID(ctx context.Context, repoID uint) ([]repository.RepositorySnapshot, error) {
	var snapshots []repository.RepositorySnapshot
	err := r.db.WithContext(ctx).
		Where("repository_id = ?", repoID).
		Order("captured_at desc").
		Find(&snapshots).Error
	return snapshots, err
}

func (r *RepositoryRepo) CountStats(ctx context.Context) (totalRepos int64, totalStars int64, distinctLanguages int64, err error) {
	err = r.db.WithContext(ctx).Model(&repository.Repository{}).Count(&totalRepos).Error
	if err != nil {
		return
	}
	err = r.db.WithContext(ctx).Model(&repository.Repository{}).Select("COALESCE(SUM(stars), 0)").Scan(&totalStars).Error
	if err != nil {
		return
	}
	err = r.db.WithContext(ctx).Model(&repository.Repository{}).Where("primary_language IS NOT NULL AND primary_language != ''").Distinct("primary_language").Count(&distinctLanguages).Error
	return
}

func (r *RepositoryRepo) FindTopWithGrowth(ctx context.Context, limit int) ([]repository.Repository, error) {
	var repos []repository.Repository
	err := r.db.WithContext(ctx).Order("stars desc").Limit(limit).Find(&repos).Error
	return repos, err
}

type LanguageStat struct {
	Language   string `json:"language"`
	TotalStars int64  `json:"total_stars"`
	RepoCount  int64  `json:"repo_count"`
}

func (r *RepositoryRepo) FindLanguageGrowth(ctx context.Context) ([]LanguageStat, error) {
	var stats []LanguageStat
	err := r.db.WithContext(ctx).
		Model(&repository.Repository{}).
		Where("primary_language IS NOT NULL AND primary_language != ''").
		Select("primary_language AS language, COALESCE(SUM(stars), 0) AS total_stars, COUNT(*) AS repo_count").
		Group("primary_language").
		Order("total_stars DESC").
		Scan(&stats).Error
	return stats, err
}

type ContributorStat struct {
	Month       string `json:"month"`
	TotalContributors int64 `json:"total_contributors"`
	RepoCount   int64  `json:"repo_count"`
}

func (r *RepositoryRepo) FindContributorTrend(ctx context.Context) ([]ContributorStat, error) {
	var stats []ContributorStat
	err := r.db.WithContext(ctx).
		Raw(`SELECT 
			TO_CHAR(captured_at, 'YYYY-MM') AS month,
			COALESCE(SUM(contributors), 0) AS total_contributors,
			COUNT(DISTINCT repository_id) AS repo_count
		FROM repository_snapshots
		WHERE captured_at >= NOW() - INTERVAL '12 months'
		GROUP BY month
		ORDER BY month`).
		Scan(&stats).Error
	return stats, err
}

type RepoGrowthStat struct {
	Month      string `json:"month"`
	TotalStars int64  `json:"total_stars"`
	TotalForks int64  `json:"total_forks"`
	RepoCount  int64  `json:"repo_count"`
}

func (r *RepositoryRepo) FindRepoGrowth(ctx context.Context) ([]RepoGrowthStat, error) {
	var stats []RepoGrowthStat
	err := r.db.WithContext(ctx).
		Raw(`SELECT 
			TO_CHAR(captured_at, 'YYYY-MM') AS month,
			COALESCE(SUM(stars), 0) AS total_stars,
			COALESCE(SUM(forks), 0) AS total_forks,
			COUNT(DISTINCT repository_id) AS repo_count
		FROM repository_snapshots
		WHERE captured_at >= NOW() - INTERVAL '12 months'
		GROUP BY month
		ORDER BY month`).
		Scan(&stats).Error
	return stats, err
}