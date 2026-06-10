package services

import (
	"context"
	"log"
	"time"

	"opensource-pulse/api/internal/config"
	githubClient "opensource-pulse/api/internal/integrations/github"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"

	"gorm.io/gorm"
)

type SyncService struct {
	cfg     *config.Config
	github  *githubClient.Client
	repo    *repositories.RepositoryRepo
	tech    *repositories.TechnologyRepo
	db      *gorm.DB
}

func NewSyncService(cfg *config.Config, github *githubClient.Client, repo *repositories.RepositoryRepo, tech *repositories.TechnologyRepo, db *gorm.DB) *SyncService {
	return &SyncService{cfg: cfg, github: github, repo: repo, tech: tech, db: db}
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

			// Simpan topics sebagai teknologi
			for _, topic := range gh.Topics {
				s.ensureTechnology(ctx, topic, repo.ID)
			}

			log.Printf("Synced: %s (stars: %d)", gh.FullName, gh.StargazersCount)
		}
	}

	return nil
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

func (s *SyncService) ensureTechnology(ctx context.Context, topic string, repoID uint) {
	slug := topic
	var tech technology.Technology
	result := s.db.Where("slug = ?", slug).First(&tech)
	if result.Error != nil {
		tech = technology.Technology{
			TechnologyName: topic,
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