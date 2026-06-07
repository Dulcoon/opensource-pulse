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

func (r *TechnologyRepo) FindNamesByRepoID(ctx context.Context, repoID uint) ([]string, error) {
	var names []string
	err := r.db.WithContext(ctx).
		Table("technologies").
		Joins("JOIN repository_technologies ON technologies.id = repository_technologies.technology_id").
		Where("repository_technologies.repository_id = ?", repoID).
		Pluck("technologies.technology_name", &names).Error
	return names, err
}