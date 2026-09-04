package services

import (
	"context"
	"log"
	"math"
	"strings"
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

type TechVelocityRaw struct {
	TechnologyID uint
	TechName     string
	Slug         string
	RepoCount    int
	CurrentStars int64
	PrevStars    int64
	DeltaStars   int64
	GrowthPct    float64
}

func (c *RadarCalculator) Calculate(ctx context.Context) error {
	log.Println("[RadarCalculator] Starting Tech Radar calculation and taxonomy cleanup...")

	// 1. Purge generic non-technology topics from database
	var blacklistedSlugs []string
	for tag := range GenericTopicBlacklist {
		blacklistedSlugs = append(blacklistedSlugs, tag)
	}
	if len(blacklistedSlugs) > 0 {
		c.db.Exec(`DELETE FROM technology_scores WHERE technology_id IN (SELECT id FROM technologies WHERE LOWER(slug) IN (?))`, blacklistedSlugs)
		c.db.Exec(`DELETE FROM repository_technologies WHERE technology_id IN (SELECT id FROM technologies WHERE LOWER(slug) IN (?))`, blacklistedSlugs)
		c.db.Exec(`DELETE FROM technologies WHERE LOWER(slug) IN (?)`, blacklistedSlugs)
	}

	// 2. Query 7-day star velocities across repositories linked to each technology
	var rawRows []struct {
		TechnologyID uint   `gorm:"column:tech_id"`
		TechName     string `gorm:"column:technology_name"`
		Slug         string `gorm:"column:slug"`
		RepoCount    int    `gorm:"column:repo_count"`
		CurrentStars int64  `gorm:"column:current_stars"`
		PrevStars    int64  `gorm:"column:prev_stars"`
		DeltaStars   int64  `gorm:"column:delta_stars"`
	}

	query := `
		SELECT 
			t.id AS tech_id,
			t.technology_name,
			t.slug,
			COUNT(DISTINCT r.id) AS repo_count,
			COALESCE(SUM(latest_sub.stars), 0) AS current_stars,
			COALESCE(SUM(earliest_sub.stars), 0) AS prev_stars,
			COALESCE(SUM(latest_sub.stars) - SUM(earliest_sub.stars), 0) AS delta_stars
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
			WHERE captured_at >= NOW() - INTERVAL '7 days'
			ORDER BY repository_id, captured_at ASC
		) earliest_sub ON r.id = earliest_sub.repository_id
		GROUP BY t.id, t.technology_name, t.slug
	`

	if err := c.db.WithContext(ctx).Raw(query).Scan(&rawRows).Error; err != nil {
		return err
	}

	if len(rawRows) == 0 {
		log.Println("[RadarCalculator] No technologies to score.")
		return nil
	}

	// 3. Filter out any remaining blacklisted tags and calculate stats
	var velocities []TechVelocityRaw
	var maxDeltaStars int64 = 0
	var maxRepoCount int = 0
	var maxGrowthPct float64 = 0.0
	var maxCurrentStars int64 = 0

	for _, row := range rawRows {
		slugLower := strings.ToLower(strings.TrimSpace(row.Slug))
		nameLower := strings.ToLower(strings.TrimSpace(row.TechName))
		if IsBlacklistedTopic(slugLower) || IsBlacklistedTopic(nameLower) {
			continue
		}

		delta := row.DeltaStars
		if delta < 0 {
			delta = 0
		}

		growth := 0.0
		if row.PrevStars > 0 && delta > 0 {
			growth = (float64(delta) / float64(row.PrevStars)) * 100.0
		}

		growth = math.Round(growth*100) / 100

		v := TechVelocityRaw{
			TechnologyID: row.TechnologyID,
			TechName:     row.TechName,
			Slug:         row.Slug,
			RepoCount:    row.RepoCount,
			CurrentStars: row.CurrentStars,
			PrevStars:    row.PrevStars,
			DeltaStars:   delta,
			GrowthPct:    growth,
		}

		if delta > maxDeltaStars {
			maxDeltaStars = delta
		}
		if row.RepoCount > maxRepoCount {
			maxRepoCount = row.RepoCount
		}
		if growth > maxGrowthPct {
			maxGrowthPct = growth
		}
		if row.CurrentStars > maxCurrentStars {
			maxCurrentStars = row.CurrentStars
		}

		velocities = append(velocities, v)
	}

	if len(velocities) == 0 {
		log.Println("[RadarCalculator] No valid technologies after blacklist filtering.")
		return nil
	}

	if maxRepoCount == 0 {
		maxRepoCount = 1
	}
	if maxGrowthPct <= 0 {
		maxGrowthPct = 1.0
	}

	now := time.Now()

	// 4. Delete old scores and write new weighted scores
	c.db.Exec("DELETE FROM technology_scores")

	for _, v := range velocities {
		var finalScore float64

		if maxDeltaStars > 0 {
			// Weighted Trending Velocity:
			// 50% Absolute Star Delta (viral velocity)
			// 30% Relative Growth Rate (breakout momentum)
			// 20% Adoption Breadth (ecosystem repo count)
			velocityComponent := (float64(v.DeltaStars) / float64(maxDeltaStars)) * 50.0
			growthComponent := (math.Min(v.GrowthPct, maxGrowthPct) / maxGrowthPct) * 30.0
			breadthComponent := (float64(v.RepoCount) / float64(maxRepoCount)) * 20.0
			finalScore = velocityComponent + growthComponent + breadthComponent
		} else {
			// Cold-start fallback: balance adoption breadth with total traction
			finalScore = (float64(v.RepoCount) / float64(maxRepoCount)) * 60.0 +
				(float64(v.CurrentStars) / float64(maxCurrentStars)) * 40.0
		}

		finalScore = math.Round(finalScore*100) / 100
		if finalScore > 100.0 {
			finalScore = 100.0
		}

		status := c.determineStatus(finalScore, v.GrowthPct)
		growthVal := v.GrowthPct

		scoreRecord := technology.TechnologyScore{
			TechnologyID:     v.TechnologyID,
			Score:            &finalScore,
			GrowthPercentage: &growthVal,
			Status:           &status,
			RepositoryCount:  &v.RepoCount,
			CalculatedAt:     &now,
		}

		c.db.Create(&scoreRecord)
	}

	log.Printf("[RadarCalculator] Successfully calculated Tech Radar scores for %d genuine technologies.", len(velocities))
	return nil
}

func (c *RadarCalculator) determineStatus(score, growth float64) string {
	switch {
	case score >= 70 || growth >= 0.20:
		return "Exploding"
	case score >= 45 || growth >= 0.10:
		return "Rising"
	case score >= 20:
		return "Stable"
	default:
		return "Declining"
	}
}
