package services

import (
	"context"
	"math"
	"time"

	githubClient "opensource-pulse/api/internal/integrations/github"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/repositories"

	"gorm.io/gorm"
)

type HealthService struct {
	github *githubClient.Client
	repo   *repositories.RepositoryRepo
	db     *gorm.DB
}

func NewHealthService(github *githubClient.Client, repo *repositories.RepositoryRepo, db *gorm.DB) *HealthService {
	return &HealthService{github: github, repo: repo, db: db}
}

func (s *HealthService) CalculateAndSave(ctx context.Context, repoID uint) (*repository.RepositoryHealthScore, error) {
	r, err := s.repo.FindByID(ctx, repoID)
	if err != nil {
		return nil, err
	}

	now := time.Now()

	// Ambil release terbaru
	var lastRelease *time.Time
	release, err := s.github.GetLatestRelease(ctx, r.Owner, r.RepositoryName)
	if err == nil && release != nil {
		lastRelease = &release.PublishedAt
	}

	// Ambil snapshot terbaru buat contributors
	contributors := 0
	snapshots, _ := s.repo.FindSnapshotsByRepoID(ctx, repoID)
	if len(snapshots) > 0 {
		contributors = snapshots[0].Contributors
	}

	activity := calculateActivity(r.UpdatedAt, now)
	maintenance := calculateMaintenance(lastRelease, now)
	community := calculateCommunity(r.Forks, contributors)
	issue := calculateIssues(r.OpenIssues, r.Stars)
	overall := (activity + maintenance + community + issue) / 4
	status := scoreStatus(overall)

	score := repository.RepositoryHealthScore{
		RepositoryID:     repoID,
		OverallScore:     &overall,
		ActivityScore:    &activity,
		MaintenanceScore: &maintenance,
		CommunityScore:   &community,
		IssueScore:       &issue,
		Status:           &status,
		CalculatedAt:     &now,
	}

	s.db.Where("repository_id = ?", repoID).Delete(&repository.RepositoryHealthScore{})
	s.db.Create(&score)

	return &score, nil
}

func calculateActivity(updatedAt time.Time, now time.Time) float64 {
	days := now.Sub(updatedAt).Hours() / 24
	switch {
	case days <= 1:
		return 95
	case days <= 7:
		return 80 + 15*(1-(days-1)/6)
	case days <= 30:
		return 50 + 30*(1-(days-7)/23)
	case days <= 90:
		return 20 + 30*(1-(days-30)/60)
	default:
		return math.Max(0, 20*(1-(days-90)/270))
	}
}

func calculateMaintenance(lastRelease *time.Time, now time.Time) float64 {
	if lastRelease == nil {
		return 10
	}
	days := now.Sub(*lastRelease).Hours() / 24
	switch {
	case days <= 30:
		return 90 + 10*(1-days/30)
	case days <= 90:
		return 60 + 30*(1-(days-30)/60)
	case days <= 180:
		return 30 + 30*(1-(days-90)/90)
	default:
		return math.Max(0, 30*(1-(days-180)/540))
	}
}

func calculateCommunity(forks int, contributors int) float64 {
	maxForks := 500000.0
	maxContributors := 5000.0

	forkScore := math.Min(float64(forks)/maxForks, 1) * 50
	contribScore := math.Min(float64(contributors)/maxContributors, 1) * 50

	return forkScore + contribScore
}

func calculateIssues(openIssues int, stars int) float64 {
	if stars == 0 {
		return 50
	}
	ratio := float64(openIssues) / float64(stars)
	switch {
	case ratio <= 0:
		return 100
	case ratio <= 0.001:
		return 95
	case ratio <= 0.005:
		return 85
	case ratio <= 0.01:
		return 70
	case ratio <= 0.05:
		return 50
	case ratio <= 0.1:
		return 30
	default:
		return 10
	}
}

func scoreStatus(score float64) string {
	switch {
	case score >= 80:
		return "Excellent"
	case score >= 60:
		return "Good"
	case score >= 40:
		return "Fair"
	default:
		return "Poor"
	}
}
