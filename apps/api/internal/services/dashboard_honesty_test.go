package services

// Data-honesty regression tests for the dashboard pipeline.
//
// Run against a scratch database only:
//
//	TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/pulse_verify?sslmode=disable \
//	  go test ./internal/services/ -run TestDashboardHonesty -v
//
// Skipped when TEST_DATABASE_URL is unset.

import (
	"context"
	"os"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/domain/user"
	"opensource-pulse/api/internal/repositories"
)

func honestyDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL unset")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	for _, tbl := range []string{
		"repository_snapshots", "repository_summaries", "repository_health_scores",
		"repository_technologies", "technology_scores", "technologies",
		"weekly_reports", "daily_insights", "repositories", "users",
	} {
		db.Exec("DROP TABLE IF EXISTS " + tbl + " CASCADE")
	}
	if err := db.AutoMigrate(
		&user.User{},
		&repository.Repository{},
		&repository.RepositorySnapshot{},
		&repository.RepositorySummary{},
		&repository.RepositoryHealthScore{},
		&technology.Technology{},
		&technology.RepositoryTechnology{},
		&technology.TechnologyScore{},
		&report.WeeklyReport{},
		&report.DailyInsight{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func intPtr(i int) *int { return &i }

func TestDashboardHonesty(t *testing.T) {
	db := honestyDB(t)
	ctx := context.Background()
	now := time.Now().Truncate(time.Second)

	repoRepo := repositories.NewRepositoryRepo(db)
	techRepo := repositories.NewTechnologyRepo(db)
	reportRepo := repositories.NewReportRepo(db)

	// Repo A: measured history. Old points observe stars ONLY (NULL rest).
	repoA := repository.Repository{GithubID: 1, Owner: "acme", RepositoryName: "widget", FullName: "acme/widget", Stars: 1120}
	if err := db.Create(&repoA).Error; err != nil {
		t.Fatalf("seed repoA: %v", err)
	}
	snapsA := []repository.RepositorySnapshot{
		{RepositoryID: repoA.ID, Stars: 1120, Forks: intPtr(100), OpenIssues: intPtr(5), CapturedAt: now},
		{RepositoryID: repoA.ID, Stars: 1100, Forks: intPtr(99), Contributors: intPtr(48), CapturedAt: now.Add(-48 * time.Hour)},
		{RepositoryID: repoA.ID, Stars: 1060, CapturedAt: now.Add(-72 * time.Hour)},
		{RepositoryID: repoA.ID, Stars: 1000, CapturedAt: now.Add(-240 * time.Hour)},
	}
	for _, s := range snapsA {
		if err := db.Create(&s).Error; err != nil {
			t.Fatalf("seed snapsA: %v", err)
		}
	}

	// Repo B: single snapshot → unmeasurable, must read growth 0.
	repoB := repository.Repository{GithubID: 2, Owner: "acme", RepositoryName: "fresh", FullName: "acme/fresh", Stars: 5000}
	if err := db.Create(&repoB).Error; err != nil {
		t.Fatalf("seed repoB: %v", err)
	}
	if err := db.Create(&repository.RepositorySnapshot{RepositoryID: repoB.ID, Stars: 5000, CapturedAt: now}).Error; err != nil {
		t.Fatalf("seed snapsB: %v", err)
	}

	// Tech linked to repo A, two score batches (append-only history).
	tech := technology.Technology{TechnologyName: "widgets", Slug: "widgets"}
	if err := db.Create(&tech).Error; err != nil {
		t.Fatalf("seed tech: %v", err)
	}
	if err := db.Create(&technology.RepositoryTechnology{RepositoryID: repoA.ID, TechnologyID: tech.ID}).Error; err != nil {
		t.Fatalf("seed link: %v", err)
	}
	oldCalc := now.Add(-24 * time.Hour).Truncate(time.Minute)
	newCalc := now.Truncate(time.Minute)
	oldScore, oldGrowth, oldStatus, oldCount := 10.0, 1.0, "Stable", 1
	newScore, newGrowth, newStatus, newCount := 55.0, 5.0, "Rising", 1
	for _, sc := range []technology.TechnologyScore{
		{TechnologyID: tech.ID, Score: &oldScore, GrowthPercentage: &oldGrowth, Status: &oldStatus, RepositoryCount: &oldCount, CalculatedAt: &oldCalc},
		{TechnologyID: tech.ID, Score: &newScore, GrowthPercentage: &newGrowth, Status: &newStatus, RepositoryCount: &newCount, CalculatedAt: &newCalc},
	} {
		if err := db.Create(&sc).Error; err != nil {
			t.Fatalf("seed scores: %v", err)
		}
	}

	// 1. Freshness signal tracks the newest observation.
	maxSnap, err := repoRepo.FindMaxSnapshotTime(ctx)
	if err != nil || maxSnap == nil || maxSnap.Before(now.Add(-time.Minute)) {
		t.Fatalf("FindMaxSnapshotTime = %v, %v; want ~now", maxSnap, err)
	}
	maxScore, err := techRepo.FindMaxScoresTime(ctx)
	if err != nil || maxScore == nil || !maxScore.Equal(newCalc) {
		t.Fatalf("FindMaxScoresTime = %v, %v; want %v", maxScore, err, newCalc)
	}

	// 2. Latest batch only (append-only history must not leak old rows).
	latest, err := techRepo.FindLatestScores(ctx)
	if err != nil || len(latest) != 1 || latest[0].CalculatedAt == nil || !latest[0].CalculatedAt.Equal(newCalc) {
		t.Fatalf("FindLatestScores returned %d rows (want exactly the newest batch)", len(latest))
	}

	// 3. Window movers: 7d → A +60 (1120-1060), B 0; 30d → A +120.
	movers7 := ComputeWindowMovers(repoRepo, ctx, 5, now.Add(-7*24*time.Hour))
	got := map[uint]int{}
	for _, m := range movers7 {
		got[m.ID] = m.Growth
	}
	if got[repoA.ID] != 60 {
		t.Errorf("7d growth repoA = %d, want 60", got[repoA.ID])
	}
	if got[repoB.ID] != 0 {
		t.Errorf("7d growth repoB = %d, want 0 (unmeasured)", got[repoB.ID])
	}
	movers30 := ComputeWindowMovers(repoRepo, ctx, 5, now.Add(-30*24*time.Hour))
	got30 := map[uint]int{}
	for _, m := range movers30 {
		got30[m.ID] = m.Growth
	}
	if got30[repoA.ID] != 120 {
		t.Errorf("30d growth repoA = %d, want 120", got30[repoA.ID])
	}

	// 4. Tech velocity over 7d: (1120-1060)/1060*100 = 5.66.
	vel, err := techRepo.FindTechVelocity(ctx, 168)
	if err != nil || len(vel) != 1 {
		t.Fatalf("FindTechVelocity = %v, %v", vel, err)
	}
	if vel[0].GrowthPct < 5.65 || vel[0].GrowthPct > 5.67 {
		t.Errorf("tech 7d growth = %.2f, want 5.66", vel[0].GrowthPct)
	}
	if vel[0].DeltaStars != 60 {
		t.Errorf("tech 7d delta = %d, want 60", vel[0].DeltaStars)
	}

	// 5. Contributors: NULL skipped, last observed (48) wins.
	known, ok := repoRepo.FindLatestKnownContributors(ctx, repoA.ID)
	if !ok || known != 48 {
		t.Errorf("latest known contributors = %d,%v; want 48,true", known, ok)
	}
	if _, ok := repoRepo.FindLatestKnownContributors(ctx, repoB.ID); ok {
		t.Errorf("repoB contributors known=true; want false (never observed)")
	}

	// 6. Range parsing falls back honestly.
	if k, h := ParseDashboardRange("bogus"); k != "7d" || h != 168 {
		t.Errorf("ParseDashboardRange(bogus) = %s,%d; want 7d,168", k, h)
	}

	// 7. End-to-end dashboard carries meta + window-aware growth.
	svc := NewDashboardService(repoRepo, techRepo, reportRepo)
	resp, err := svc.GetDashboard(ctx, "7d")
	if err != nil {
		t.Fatalf("GetDashboard: %v", err)
	}
	if resp.Meta.Range != "7d" || resp.Meta.WindowHours != 168 {
		t.Errorf("meta range = %+v; want 7d/168", resp.Meta)
	}
	if resp.Meta.DataAsOf == nil || resp.Meta.LastSyncAt == nil || resp.Meta.ScoresCalculatedAt == nil || resp.Meta.NextSyncAt == nil {
		t.Errorf("meta freshness incomplete: %+v", resp.Meta)
	}
	if len(resp.HotTechnologies) != 1 || resp.HotTechnologies[0].GrowthPercentage == nil ||
		*resp.HotTechnologies[0].GrowthPercentage < 5.65 {
		t.Errorf("hot tech window growth not applied: %+v", resp.HotTechnologies)
	}
}
