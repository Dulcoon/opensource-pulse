package services

import (
	"context"
	"sort"
	"time"

	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"
)

type DashboardService struct {
	repoRepo   *repositories.RepositoryRepo
	techRepo   *repositories.TechnologyRepo
	reportRepo *repositories.ReportRepo
}

func NewDashboardService(repoRepo *repositories.RepositoryRepo, techRepo *repositories.TechnologyRepo, reportRepo *repositories.ReportRepo) *DashboardService {
	return &DashboardService{repoRepo: repoRepo, techRepo: techRepo, reportRepo: reportRepo}
}

type FastestGrowingRepo struct {
	ID              uint    `json:"id"`
	FullName        string  `json:"full_name"`
	Stars           int     `json:"stars"`
	Growth          int     `json:"growth"`
	PrimaryLanguage *string `json:"primary_language,omitempty"`
}

type WeeklyStats struct {
	TotalRepos         int64 `json:"total_repos"`
	TotalStars         int64 `json:"total_stars"`
	ActiveLanguages    int64 `json:"active_languages"`
	ActiveTechnologies int64 `json:"active_technologies"`
}

type DashboardResponse struct {
	HotTechnologies      []technology.TechnologyScore `json:"hot_technologies"`
	FastestGrowingRepo   *FastestGrowingRepo          `json:"fastest_growing_repo,omitempty"`
	FastestGrowingRepos  []FastestGrowingRepo         `json:"fastest_growing_repos,omitempty"`
	EmergingTechnologies []technology.TechnologyScore `json:"emerging_technologies,omitempty"`
	WeeklyStatistics     *WeeklyStats                 `json:"weekly_statistics,omitempty"`
	WeeklyInsight        *report.DailyInsight         `json:"weekly_insight"`
	Meta                 DashboardMeta                `json:"meta"`
}

// DashboardMeta tells clients exactly how fresh the payload is, so the UI can
// render honest "updated X ago" labels instead of claiming to be live.
type DashboardMeta struct {
	// Range is the normalized velocity window the response was computed for.
	Range string `json:"range"`
	// WindowHours is the window length behind Range (24, 168 or 720).
	WindowHours int `json:"window_hours"`
	// DataAsOf is the newest data point backing this response (nil = no data yet).
	DataAsOf *time.Time `json:"data_as_of,omitempty"`
	// LastSyncAt is the newest repository snapshot capture time.
	LastSyncAt *time.Time `json:"last_sync_at,omitempty"`
	// ScoresCalculatedAt is the newest radar calculation time.
	ScoresCalculatedAt *time.Time `json:"scores_calculated_at,omitempty"`
	// NextSyncAt estimates the next scheduled sync (6h cadence after LastSyncAt).
	NextSyncAt *time.Time `json:"next_sync_at,omitempty"`
}

// ParseDashboardRange normalizes the ?range= query value into a supported key
// and its window in hours. Unknown values fall back to the 7-day window.
func ParseDashboardRange(raw string) (key string, windowHours int) {
	switch raw {
	case "24h":
		return "24h", 24
	case "30d":
		return "30d", 720
	default:
		return "7d", 168
	}
}

func (s *DashboardService) GetDashboard(ctx context.Context, rangeKey string) (*DashboardResponse, error) {
	rangeKey, windowHours := ParseDashboardRange(rangeKey)
	cutoff := time.Now().Add(-time.Duration(windowHours) * time.Hour)

	// Hot technologies: latest radar batch, with growth recomputed over the
	// requested window so the numbers actually respond to ?range=.
	scores, err := s.techRepo.FindLatestScores(ctx)
	if err != nil {
		return nil, err
	}
	if velocities, verr := s.techRepo.FindTechVelocity(ctx, windowHours); verr == nil {
		velByTech := make(map[uint]repositories.TechVelocity, len(velocities))
		for _, v := range velocities {
			velByTech[v.TechnologyID] = v
		}
		for i := range scores {
			if v, ok := velByTech[scores[i].TechnologyID]; ok {
				g := v.GrowthPct
				scores[i].GrowthPercentage = &g
			}
		}
	}

	// Emerging technologies: top window growers from the latest batch.
	emerging := topWindowGrowers(scores, 5)

	// Weekly insight (latest available, may be older than the window).
	insight, _ := s.reportRepo.FindLatestInsight(ctx)

	// Weekly statistics
	totalRepos, totalStars, distinctLangs, _ := s.repoRepo.CountStats(ctx)
	totalTechs, _ := s.techRepo.CountTechnologies(ctx)

	// Fastest growing repositories within the requested window.
	fastestList := s.findFastestGrowingRepos(ctx, 5, cutoff)
	var fastest *FastestGrowingRepo
	if len(fastestList) > 0 {
		fastest = &fastestList[0]
	}

	// Freshness signals.
	lastSync, _ := s.repoRepo.FindMaxSnapshotTime(ctx)
	scoresTime, _ := s.techRepo.FindMaxScoresTime(ctx)
	meta := DashboardMeta{
		Range:              rangeKey,
		WindowHours:        windowHours,
		DataAsOf:           lastSync,
		LastSyncAt:         lastSync,
		ScoresCalculatedAt: scoresTime,
	}
	if lastSync != nil {
		next := lastSync.Add(6 * time.Hour)
		meta.NextSyncAt = &next
	}

	return &DashboardResponse{
		HotTechnologies:      scores,
		FastestGrowingRepo:   fastest,
		FastestGrowingRepos:  fastestList,
		EmergingTechnologies: emerging,
		WeeklyStatistics: &WeeklyStats{
			TotalRepos:         totalRepos,
			TotalStars:         totalStars,
			ActiveLanguages:    distinctLangs,
			ActiveTechnologies: totalTechs,
		},
		WeeklyInsight: insight,
		Meta:          meta,
	}, nil
}

// topWindowGrowers picks the highest window-growth entries of the latest
// batch. Score/status stay as calculated; only the window growth (already
// overridden on the input slice) drives the ranking.
func topWindowGrowers(scores []technology.TechnologyScore, limit int) []technology.TechnologyScore {
	filtered := make([]technology.TechnologyScore, 0, len(scores))
	for _, sc := range scores {
		if sc.GrowthPercentage != nil && *sc.GrowthPercentage > 0 {
			filtered = append(filtered, sc)
		}
	}
	sort.Slice(filtered, func(i, j int) bool {
		return *filtered[i].GrowthPercentage > *filtered[j].GrowthPercentage
	})
	if len(filtered) > limit {
		filtered = filtered[:limit]
	}
	return filtered
}

func (s *DashboardService) findFastestGrowingRepos(ctx context.Context, limit int, cutoff time.Time) []FastestGrowingRepo {
	topRepos, err := s.repoRepo.FindTopWithGrowth(ctx, 15)
	if err != nil || len(topRepos) == 0 {
		return nil
	}

	type growthInfo struct {
		repo   repository.Repository
		growth int
	}
	var candidates []growthInfo

	for _, r := range topRepos {
		snapshots, err := s.repoRepo.FindSnapshotsByRepoID(ctx, r.ID)
		if err != nil || len(snapshots) == 0 {
			candidates = append(candidates, growthInfo{repo: r, growth: 0})
			continue
		}
		// Growth over the requested window: newest snapshot vs the oldest
		// snapshot captured inside the window. Snapshots are newest-first.
		// A single in-window snapshot means no measurable movement.
		latest := snapshots[0].Stars
		earliest := latest
		inWindow := 0
		for _, sn := range snapshots {
			if sn.CapturedAt.Before(cutoff) {
				break
			}
			earliest = sn.Stars
			inWindow++
		}
		growth := 0
		if inWindow >= 2 {
			growth = latest - earliest
		}
		candidates = append(candidates, growthInfo{repo: r, growth: growth})
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].growth > candidates[j].growth
	})

	resultCount := limit
	if len(candidates) < resultCount {
		resultCount = len(candidates)
	}

	result := make([]FastestGrowingRepo, 0, resultCount)
	for i := 0; i < resultCount; i++ {
		c := candidates[i]
		result = append(result, FastestGrowingRepo{
			ID:              c.repo.ID,
			FullName:        c.repo.FullName,
			Stars:           c.repo.Stars,
			Growth:          c.growth,
			PrimaryLanguage: c.repo.PrimaryLanguage,
		})
	}

	return result
}