package repositories

import (
	"context"
	"fmt"
	"time"

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
		Preload("Technology").
		Where("calculated_at = (SELECT MAX(calculated_at) FROM technology_scores)").
		Order("score desc").
		Find(&scores).Error
	return scores, err
}

func (r *TechnologyRepo) FindAllScores(ctx context.Context) ([]technology.TechnologyScore, error) {
	var scores []technology.TechnologyScore
	err := r.db.WithContext(ctx).
		Preload("Technology").
		Order("calculated_at desc, score desc").
		Find(&scores).Error
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
		Preload("Technology").
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

// FindMaxScoresTime returns the newest radar calculation time.
// Returns (nil, nil) when no scores exist yet.
func (r *TechnologyRepo) FindMaxScoresTime(ctx context.Context) (*time.Time, error) {
	var max *time.Time
	err := r.db.WithContext(ctx).
		Model(&technology.TechnologyScore{}).
		Select("MAX(calculated_at)").
		Scan(&max).Error
	if err != nil {
		return nil, err
	}
	return max, nil
}

// TechVelocity is the star velocity of one technology over a caller-chosen
// window, computed directly from repository snapshots (same semantics as the
// daily radar calculation, but parameterized by window).
type TechVelocity struct {
	TechnologyID uint    `json:"technology_id"`
	DeltaStars   int64   `json:"delta_stars"`
	GrowthPct    float64 `json:"growth_pct"`
	RepoCount    int     `json:"repo_count"`
}

// FindTechVelocity computes per-technology star deltas between the latest
// snapshot of each repository and its earliest snapshot inside the window.
// windowHours must be a positive int chosen by the caller (dashboard only
// passes 24, 168 or 720); it is interpolated as an integer so no user input
// ever reaches the SQL string.
func (r *TechnologyRepo) FindTechVelocity(ctx context.Context, windowHours int) ([]TechVelocity, error) {
	if windowHours <= 0 {
		windowHours = 168
	}
	var rows []TechVelocity
	query := fmt.Sprintf(`
		SELECT
			t.id AS technology_id,
			COALESCE(SUM(latest_sub.stars) - SUM(earliest_sub.stars), 0) AS delta_stars,
			CASE
				WHEN COALESCE(SUM(earliest_sub.stars), 0) > 0
				THEN ROUND((COALESCE(SUM(latest_sub.stars), 0) - COALESCE(SUM(earliest_sub.stars), 0)) * 100.0 / COALESCE(SUM(earliest_sub.stars), 0), 2)
				ELSE 0
			END AS growth_pct,
			COUNT(DISTINCT r.id) AS repo_count
		FROM technologies t
		JOIN repository_technologies rt ON t.id = rt.technology_id
		JOIN repositories r ON rt.repository_id = r.id
		LEFT JOIN (
			SELECT DISTINCT ON (repository_id) repository_id, stars
			FROM repository_snapshots
			ORDER BY repository_id, captured_at DESC
		) latest_sub ON r.id = latest_sub.repository_id
		LEFT JOIN (
			SELECT DISTINCT ON (repository_id) repository_id, stars
			FROM repository_snapshots
			WHERE captured_at >= NOW() - INTERVAL '%d hours'
			ORDER BY repository_id, captured_at ASC
		) earliest_sub ON r.id = earliest_sub.repository_id
		GROUP BY t.id
	`, windowHours)
	err := r.db.WithContext(ctx).Raw(query).Scan(&rows).Error
	return rows, err
}

type TechTrendStat struct {
	Month    string  `json:"month"`
	TechName string  `json:"tech_name"`
	AvgScore float64 `json:"avg_score"`
	RepoCount int64  `json:"repo_count"`
}

func (r *TechnologyRepo) FindTechnologyTrend(ctx context.Context) ([]TechTrendStat, error) {
	var stats []TechTrendStat
	err := r.db.WithContext(ctx).
		Raw(`SELECT 
			TO_CHAR(ts.calculated_at, 'YYYY-MM') AS month,
			t.technology_name AS tech_name,
			AVG(ts.score) AS avg_score,
			MAX(ts.repository_count) AS repo_count
		FROM technology_scores ts
		JOIN technologies t ON t.id = ts.technology_id
		WHERE ts.calculated_at >= NOW() - INTERVAL '12 months'
		GROUP BY month, t.technology_name
		ORDER BY month, avg_score DESC`).
		Scan(&stats).Error
	return stats, err
}