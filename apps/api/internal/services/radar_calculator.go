package services

import (
	"context"
	"log"
	"math"
	"time"

	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"

	"gorm.io/gorm"
)

type RadarCalculator struct {
	techRepo *repositories.TechnologyRepo
	db       *gorm.DB
}

func NewRadarCalculator(techRepo *repositories.TechnologyRepo, db *gorm.DB) *RadarCalculator {
	return &RadarCalculator{techRepo: techRepo, db: db}
}

func (c *RadarCalculator) Calculate(ctx context.Context) error {
	log.Println("Calculating Tech Radar scores...")

	stats, err := c.techRepo.FindAllTechStats(ctx)
	if err != nil {
		return err
	}

	if len(stats) == 0 {
		log.Println("No technologies found")
		return nil
	}

	// Cari max stars buat normalisasi
	var maxStars int64
	for _, s := range stats {
		if s.TotalStars > maxStars {
			maxStars = s.TotalStars
		}
	}
	if maxStars == 0 {
		maxStars = 1
	}

	var maxCount int
	for _, s := range stats {
		if s.RepoCount > maxCount {
			maxCount = s.RepoCount
		}
	}
	if maxCount == 0 {
		maxCount = 1
	}

	now := time.Now()

	// Hapus semua score yang ada
	c.db.Exec("DELETE FROM technology_scores")

	for _, stat := range stats {
		// Score: kombinasi repo count + total stars
		repoScore := float64(stat.RepoCount) / float64(maxCount) * 50
		starScore := float64(stat.TotalStars) / float64(maxStars) * 50
		score := repoScore + starScore

		// Growth: hitung dari snapshot
		growth := c.calculateGrowth(ctx, stat.TechnologyID)

		// Status
		status := c.determineStatus(score, growth)

		s := technology.TechnologyScore{
			TechnologyID:     stat.TechnologyID,
			Score:            &score,
			GrowthPercentage: &growth,
			Status:           &status,
			RepositoryCount:  &stat.RepoCount,
			CalculatedAt:     &now,
		}

		c.db.Create(&s)
	}

	log.Printf("Tech Radar calculated: %d technologies", len(stats))
	return nil
}

func (c *RadarCalculator) calculateGrowth(ctx context.Context, techID uint) float64 {
	type CurrentTotal struct {
		Total int64
	}
	var current CurrentTotal
	c.db.WithContext(ctx).
		Table("repositories").
		Joins("JOIN repository_technologies ON repositories.id = repository_technologies.repository_id").
		Where("repository_technologies.technology_id = ?", techID).
		Select("COALESCE(SUM(repositories.stars), 0) AS total").
		Scan(&current)

	type PrevTotal struct {
		Total int64
	}
	var prev PrevTotal
	c.db.WithContext(ctx).
		Raw(`SELECT COALESCE(SUM(sub.stars), 0) AS total FROM (
			SELECT DISTINCT ON (rs.repository_id) rs.stars
			FROM repository_snapshots rs
			JOIN repository_technologies rt ON rs.repository_id = rt.repository_id
			WHERE rt.technology_id = ?
			AND rs.captured_at <= NOW() - INTERVAL '30 days'
			ORDER BY rs.repository_id, rs.captured_at DESC
		) sub`, techID).
		Scan(&prev)

	if prev.Total == 0 {
		if current.Total > 0 {
			return 100.0
		}
		return 0
	}

	growth := float64(current.Total-prev.Total) / float64(prev.Total) * 100
	return math.Round(growth*100) / 100
}

func (c *RadarCalculator) determineStatus(score, growth float64) string {
	switch {
	case score >= 80 && growth >= 50:
		return "Exploding"
	case score >= 60:
		return "Rising"
	case score >= 30:
		return "Stable"
	default:
		return "Declining"
	}
}
