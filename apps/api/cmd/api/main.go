package main

import (
	"context"
	"log"
	"time"

	"github.com/hibiken/asynq"
	"github.com/gin-gonic/gin"
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
	"opensource-pulse/api/internal/scheduler"
	"opensource-pulse/api/internal/services"
	"opensource-pulse/api/internal/workers"
)

func main() {
	cfg := config.Load()
	db := database.NewPostgres(cfg)
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

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

	insightSvc := services.NewInsightService(gClient, repoRepo, techRepo, reportRepo)
	insightHandler := handlers.NewInsightHandler(insightSvc)

	// Background worker (only if Redis is reachable)
	rdb := database.NewRedis(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("WARNING: Redis unreachable (%v) — background jobs disabled", err)
	} else {
		processor := workers.NewProcessor(syncSvc, healthSvc, radarCalc, insightSvc, reportSvc, repoRepo)
		mux := asynq.NewServeMux()
		mux.HandleFunc(workers.TypeSyncRepositories, processor.ProcessSyncRepositories)
		mux.HandleFunc(workers.TypeCalculateHealth, processor.ProcessCalculateHealth)
		mux.HandleFunc(workers.TypeCalculateRadar, processor.ProcessCalculateRadar)
		mux.HandleFunc(workers.TypeGenerateInsight, processor.ProcessGenerateInsight)
		mux.HandleFunc(workers.TypeGenerateReport, processor.ProcessGenerateReport)

		workerSrv := asynq.NewServer(redisOpt, asynq.Config{Concurrency: cfg.AsynqConcurrency})
		go func() {
			log.Printf("Worker server starting (concurrency=%d)...", cfg.AsynqConcurrency)
			if err := workerSrv.Start(mux); err != nil {
				log.Fatalf("Worker server error: %v", err)
			}
		}()

		sched := scheduler.New(cfg)
		sched.Start()
	}
	cancel()

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
		api.POST("/reports/generate-insight", insightHandler.GenerateInsight)
	}

	log.Printf("Server running on :%s", cfg.ServerPort)
	r.Run(":" + cfg.ServerPort)
}