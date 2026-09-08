package services

import (
	"context"
	"log"
	"strings"
	"time"

	"opensource-pulse/api/internal/config"
	githubClient "opensource-pulse/api/internal/integrations/github"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"

	"gorm.io/gorm"
)

type SyncService struct {
	cfg       *config.Config
	github    *githubClient.Client
	repo      *repositories.RepositoryRepo
	tech      *repositories.TechnologyRepo
	db        *gorm.DB
	aiSvc     *AIService
	healthSvc *HealthService
	radarCalc *RadarCalculator
}

func NewSyncService(cfg *config.Config, github *githubClient.Client, repo *repositories.RepositoryRepo, tech *repositories.TechnologyRepo, db *gorm.DB, aiSvc *AIService, healthSvc *HealthService, radarCalc *RadarCalculator) *SyncService {
	return &SyncService{cfg: cfg, github: github, repo: repo, tech: tech, db: db, aiSvc: aiSvc, healthSvc: healthSvc, radarCalc: radarCalc}
}

func (s *SyncService) SyncRepositories(ctx context.Context) error {
	log.Println("Starting repository sync...")

	queries := []string{
		"stars:>1000 pushed:>2026-01-01",
		"topic:ai topic:agent",
	}

	for _, q := range queries {
		ghRepos, err := s.github.SearchRepositories(ctx, q, 10)
		if err != nil {
			log.Printf("Error searching repos for query %s: %v", q, err)
			continue
		}

		for _, gh := range ghRepos {
			repo := s.toDomain(&gh)
			result := s.db.Where("github_id = ?", gh.ID).Assign(&repo).FirstOrCreate(&repo)
			if result.Error != nil {
				log.Printf("Error saving repo %s: %v", gh.FullName, result.Error)
				continue
			}

			// Ambil jumlah kontributor
			contributors, _ := s.github.GetContributorsCount(ctx, gh.Owner.Login, gh.Name)

			// Buat snapshot
			snapshot := repository.RepositorySnapshot{
				RepositoryID: repo.ID,
				Stars:        gh.StargazersCount,
				Forks:        gh.ForksCount,
				OpenIssues:   gh.OpenIssuesCount,
				Contributors: contributors,
				CapturedAt:   time.Now(),
			}
			s.db.Create(&snapshot)

			// Auto-sample historical snapshots (7, 30, 90 days ago) if repository lacks historical data
			var historyCount int64
			sixDaysAgo := time.Now().AddDate(0, 0, -6)
			s.db.Model(&repository.RepositorySnapshot{}).
				Where("repository_id = ? AND captured_at <= ?", repo.ID, sixDaysAgo).
				Count(&historyCount)

			if historyCount == 0 && gh.StargazersCount > 0 {
				go func(owner, repoName string, stars int, createdAt time.Time, repoID uint, forks, issues int) {
					ctxHist, cancelHist := context.WithTimeout(context.Background(), 45*time.Second)
					defer cancelHist()
					points, err := s.github.GetHistoricalStarsMulti(ctxHist, owner, repoName, stars, createdAt, []int{7, 30, 90})
					if err == nil {
						for _, p := range points {
							s.db.Create(&repository.RepositorySnapshot{
								RepositoryID: repoID,
								Stars:        p.Stars,
								Forks:        forks,
								OpenIssues:   issues,
								Contributors: 0,
								CapturedAt:   p.Date,
							})
						}
						log.Printf("[Auto] Backfilled historical stars (7d/30d/90d) for %s/%s", owner, repoName)
					}
				}(gh.Owner.Login, gh.Name, gh.StargazersCount, gh.CreatedAt, repo.ID, gh.ForksCount, gh.OpenIssuesCount)
			}

			// Simpan topics sebagai teknologi
			for _, topic := range gh.Topics {
				s.ensureTechnology(ctx, topic, repo.ID)
			}

			// Auto generate summary + health score untuk repo baru/belum terisi
			existingSummary, _ := s.repo.FindSummaryByRepoID(ctx, repo.ID)
			existingHealth, _ := s.repo.FindHealthScoreByRepoID(ctx, repo.ID)
			if existingSummary == nil || existingHealth == nil {
				go func(rid uint, fullName string, needSummary, needHealth bool) {
					ctx2, cancel := context.WithTimeout(context.Background(), 60*time.Second)
					defer cancel()
					if needSummary {
						log.Printf("[Auto] Generating summary for %s...", fullName)
						if _, err := s.aiSvc.GenerateSummary(ctx2, rid); err != nil {
							log.Printf("[Auto] Summary failed for %s: %v", fullName, err)
						}
					}
					if needHealth {
						log.Printf("[Auto] Calculating health score for %s...", fullName)
						if _, err := s.healthSvc.CalculateAndSave(ctx2, rid); err != nil {
							log.Printf("[Auto] Health score failed for %s: %v", fullName, err)
						}
					}
				}(repo.ID, gh.FullName, existingSummary == nil, existingHealth == nil)
			}

			log.Printf("Synced: %s (stars: %d)", gh.FullName, gh.StargazersCount)
		}
	}

	return nil
}

// BackfillHistoricalSnapshots samples historical stars (7d, 30d, 90d) for all repositories lacking historical snapshots
func (s *SyncService) BackfillHistoricalSnapshots(ctx context.Context) (int, error) {
	log.Println("[HistoricalBackfill] Starting comprehensive historical stargazers backfill...")

	var allRepos []repository.Repository
	if err := s.db.WithContext(ctx).Find(&allRepos).Error; err != nil {
		return 0, err
	}

	daysToSample := []int{7, 30, 90}
	processedCount := 0

	for _, r := range allRepos {
		select {
		case <-ctx.Done():
			return processedCount, ctx.Err()
		default:
		}

		var existingOldCount int64
		sixDaysAgo := time.Now().AddDate(0, 0, -6)
		s.db.Model(&repository.RepositorySnapshot{}).
			Where("repository_id = ? AND captured_at <= ?", r.ID, sixDaysAgo).
			Count(&existingOldCount)

		if existingOldCount >= 2 {
			continue // Already has historical snapshots
		}

		log.Printf("[HistoricalBackfill] Sampling historical stars for %s (current: %d)...", r.FullName, r.Stars)
		points, err := s.github.GetHistoricalStarsMulti(ctx, r.Owner, r.RepositoryName, r.Stars, r.CreatedAt, daysToSample)
		if err != nil {
			log.Printf("[HistoricalBackfill] Failed to sample %s: %v", r.FullName, err)
			continue
		}

		for _, p := range points {
			var exists int64
			dayStart := p.Date.Truncate(24 * time.Hour)
			dayEnd := dayStart.Add(24 * time.Hour)
			s.db.Model(&repository.RepositorySnapshot{}).
				Where("repository_id = ? AND captured_at >= ? AND captured_at < ?", r.ID, dayStart, dayEnd).
				Count(&exists)

			if exists == 0 {
				snap := repository.RepositorySnapshot{
					RepositoryID: r.ID,
					Stars:        p.Stars,
					Forks:        r.Forks,
					OpenIssues:   r.OpenIssues,
					Contributors: 0,
					CapturedAt:   p.Date,
				}
				s.db.Create(&snap)
			}
		}

		processedCount++
		time.Sleep(150 * time.Millisecond) // Polite rate limit pacing
	}

	log.Printf("[HistoricalBackfill] Successfully backfilled %d repositories. Recalculating Tech Radar...", processedCount)
	if s.radarCalc != nil {
		if err := s.radarCalc.Calculate(ctx); err != nil {
			log.Printf("[HistoricalBackfill] Radar recalculation error: %v", err)
		} else {
			log.Println("[HistoricalBackfill] Tech Radar scores recalculated successfully!")
		}
	}

	return processedCount, nil
}

func (s *SyncService) toDomain(gh *githubClient.Repository) repository.Repository {
	desc := ""
	if gh.Description != nil {
		desc = *gh.Description
	}
	lang := ""
	if gh.Language != nil {
		lang = *gh.Language
	}

	return repository.Repository{
		GithubID:       gh.ID,
		Owner:          gh.Owner.Login,
		RepositoryName: gh.Name,
		FullName:       gh.FullName,
		Description:    &desc,
		PrimaryLanguage: &lang,
		Stars:          gh.StargazersCount,
		Forks:          gh.ForksCount,
		OpenIssues:     gh.OpenIssuesCount,
		Watchers:       gh.WatchersCount,
		RepositoryURL:  &gh.HTMLURL,
		DefaultBranch:  &gh.DefaultBranch,
		CreatedAt:      gh.CreatedAt,
		UpdatedAt:      gh.UpdatedAt,
	}
}

// GenericTopicBlacklist defines topics that represent curated lists, collections,
// learning materials, or generic labels rather than actual libraries/technologies.
var GenericTopicBlacklist = map[string]bool{
	"awesome":                 true,
	"awesome-list":            true,
	"awesome-lists":           true,
	"list":                    true,
	"lists":                   true,
	"resources":               true,
	"resource":                true,
	"free":                    true,
	"interview":               true,
	"interviews":              true,
	"interview-questions":     true,
	"interview-preparation":   true,
	"cheat-sheet":             true,
	"cheatsheet":              true,
	"cheatsheets":             true,
	"book":                    true,
	"books":                   true,
	"tutorial":                true,
	"tutorials":               true,
	"tutorial-code":           true,
	"education":               true,
	"open-source":             true,
	"opensource":              true,
	"programming":             true,
	"software":                true,
	"development":             true,
	"developer":               true,
	"skills":                  true,
	"collection":              true,
	"curated":                 true,
	"course":                  true,
	"courses":                 true,
	"guide":                   true,
	"guides":                  true,
	"learning":                true,
	"documentation":           true,
	"docs":                    true,
	"algorithms":              true,
	"dsa":                     true,
	"competitive-programming": true,
	"leetcode":                true,
	"hacktoberfest":           true,
	"beginner-friendly":       true,
	"starter":                 true,
	"template":                true,
	"templates":               true,
}

func IsBlacklistedTopic(topic string) bool {
	clean := strings.ToLower(strings.TrimSpace(topic))
	return GenericTopicBlacklist[clean]
}

func (s *SyncService) ensureTechnology(ctx context.Context, topic string, repoID uint) {
	topicClean := strings.ToLower(strings.TrimSpace(topic))
	if topicClean == "" || IsBlacklistedTopic(topicClean) {
		return
	}

	slug := topicClean
	var tech technology.Technology
	result := s.db.Where("slug = ?", slug).First(&tech)
	if result.Error != nil {
		tech = technology.Technology{
			TechnologyName: topicClean,
			Slug:           slug,
		}
		s.db.Create(&tech)
	}

	// Hubungkan repo dengan teknologi
	var rel technology.RepositoryTechnology
	s.db.Where("repository_id = ? AND technology_id = ?", repoID, tech.ID).First(&rel)
	if rel.ID == 0 {
		s.db.Create(&technology.RepositoryTechnology{
			RepositoryID: repoID,
			TechnologyID: tech.ID,
		})
	}
}