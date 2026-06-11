package repositories

import (
	"context"

	"opensource-pulse/api/internal/domain/technology"
	"gorm.io/gorm"
)

type TechnologyRepo struct {
	db *gorm.DB
}

func NewTechnologyRepo(db *gorm.DB) *TechnologyRepo {
	return &TechnologyRepo{db: db}
}

func (r *TechnologyRepo) FindLatestScores(ctx context.Context) ([]technology.TechnologyScore, error) {
	var scores []technology.TechnologyScore
	err := r.db.WithContext(ctx).
		Where("calculated_at = (SELECT MAX(calculated_at) FROM technology_scores)").
		Order("score desc").
		Find(&scores).Error
	return scores, err
}

func (r *TechnologyRepo) FindAllScores(ctx context.Context) ([]technology.TechnologyScore, error) {
	var scores []technology.TechnologyScore
	err := r.db.WithContext(ctx).Order("calculated_at desc, score desc").Find(&scores).Error
	return scores, err
}

func (r *TechnologyRepo) FindAll(ctx context.Context) ([]technology.Technology, error) {
	var techs []technology.Technology
	err := r.db.WithContext(ctx).Find(&techs).Error
	return techs, err
}

type TechStat struct {
	TechnologyID   uint
	TechnologyName string
	Slug           string
	RepoCount      int
	TotalStars     int64
}

func (r *TechnologyRepo) FindAllTechStats(ctx context.Context) ([]TechStat, error) {
	var stats []TechStat
	err := r.db.WithContext(ctx).
		Table("technologies").
		Select(`technologies.id AS technology_id, 
				technologies.technology_name, 
				technologies.slug,
				COUNT(repository_technologies.repository_id) AS repo_count,
				COALESCE(SUM(repositories.stars), 0) AS total_stars`).
		Joins("LEFT JOIN repository_technologies ON technologies.id = repository_technologies.technology_id").
		Joins("LEFT JOIN repositories ON repositories.id = repository_technologies.repository_id").
		Group("technologies.id, technologies.technology_name, technologies.slug").
		Order("total_stars DESC").
		Scan(&stats).Error
	return stats, err
}

func (r *TechnologyRepo) FindNamesByRepoID(ctx context.Context, repoID uint) ([]string, error) {
	var names []string
	err := r.db.WithContext(ctx).
		Table("technologies").
		Joins("JOIN repository_technologies ON technologies.id = repository_technologies.technology_id").
		Where("repository_technologies.repository_id = ?", repoID).
		Pluck("technologies.technology_name", &names).Error
	return names, err
}

func (r *TechnologyRepo) FindEmerging(ctx context.Context, limit int) ([]technology.TechnologyScore, error) {
	var scores []technology.TechnologyScore
	err := r.db.WithContext(ctx).
		Where("calculated_at = (SELECT MAX(calculated_at) FROM technology_scores)").
		Where("growth_percentage > 0").
		Order("growth_percentage desc").
		Limit(limit).
		Find(&scores).Error
	return scores, err
}

func (r *TechnologyRepo) CountTechnologies(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&technology.Technology{}).Count(&count).Error
	return count, err
}