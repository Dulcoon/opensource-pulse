package main

import (
	"log"

	"opensource-pulse/api/internal/config"
	"opensource-pulse/api/internal/database"
	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/handlers"
	githubClient "opensource-pulse/api/internal/integrations/github"
	groqClient "opensource-pulse/api/internal/integrations/groq"
	openrouterClient "opensource-pulse/api/internal/integrations/openrouter"
	"opensource-pulse/api/internal/repositories"
	"opensource-pulse/api/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	db := database.NewPostgres(cfg)
	rdb := database.NewRedis(cfg)
	_ = rdb

	ghClient := githubClient.NewClient(cfg.GitHubToken)
	gClient := groqClient.NewClient(cfg.GroqKey)
	orClient := openrouterClient.NewClient(cfg.OpenRouterKey)

	// Auto Migrate
	db.AutoMigrate(
		&repository.Repository{},
		&repository.RepositorySnapshot{},
		&repository.RepositorySummary{},
		&repository.RepositoryHealthScore{},
		&technology.Technology{},
		&technology.RepositoryTechnology{},
		&technology.TechnologyScore{},
		&report.WeeklyReport{},
		&report.DailyInsight{},
	)

	// Repositories
	repoRepo := repositories.NewRepositoryRepo(db)
	techRepo := repositories.NewTechnologyRepo(db)
	reportRepo := repositories.NewReportRepo(db)

	// Services
	dashboardSvc := services.NewDashboardService(repoRepo, techRepo, reportRepo)
	repoSvc := services.NewRepositoryService(repoRepo)
	radarSvc := services.NewRadarService(techRepo)
	radarCalc := services.NewRadarCalculator(techRepo, db)
	analyticsSvc := services.NewAnalyticsService(repoRepo, techRepo)
	reportSvc := services.NewReportService(reportRepo)

	// Handlers
	dashboardHandler := handlers.NewDashboardHandler(dashboardSvc)
	repoHandler := handlers.NewRepositoryHandler(repoSvc)
	radarHandler := handlers.NewRadarHandler(radarSvc, radarCalc)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsSvc)
	reportHandler := handlers.NewReportHandler(reportSvc)

	syncSvc := services.NewSyncService(cfg, ghClient, repoRepo, techRepo, db)
	syncHandler := handlers.NewSyncHandler(syncSvc)

	aiSvc := services.NewAIService(gClient, orClient, repoRepo, techRepo, db)
	aiHandler := handlers.NewAIHandler(aiSvc)

	healthSvc := services.NewHealthService(ghClient, repoRepo, db)
	healthHandler := handlers.NewHealthHandler(healthSvc)

	// Router
	r := gin.Default()
	api := r.Group("/api")
	{
		api.GET("/dashboard", dashboardHandler.GetDashboard)
		api.GET("/repositories", repoHandler.ListRepositories)
		api.GET("/repositories/:id", repoHandler.GetRepository)
		api.GET("/repositories/:id/summary", repoHandler.GetSummary)
		api.GET("/repositories/:id/snapshots", repoHandler.GetSnapshots)
		api.GET("/radar", radarHandler.GetRadar)
		api.POST("/radar/calculate", radarHandler.CalculateRadar)
		api.GET("/analytics", analyticsHandler.GetAnalytics)
		api.GET("/reports", reportHandler.ListReports)
		api.GET("/reports/:id", reportHandler.GetReport)
		api.POST("/sync/repositories", syncHandler.SyncRepositories)
		api.POST("/repositories/:id/summarize", aiHandler.GenerateSummary)
		api.POST("/repositories/:id/calculate-health", healthHandler.CalculateHealth)
	}

	log.Printf("Server running on :%s", cfg.ServerPort)
	r.Run(":" + cfg.ServerPort)
}