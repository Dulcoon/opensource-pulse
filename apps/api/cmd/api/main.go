package main

import (
	"context"
	"log"
	"time"

	"github.com/hibiken/asynq"
	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/config"
	"opensource-pulse/api/internal/database"
	"opensource-pulse/api/internal/middleware"
	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/domain/repository"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/domain/user"
	"opensource-pulse/api/internal/handlers"
	githubClient "opensource-pulse/api/internal/integrations/github"
	geminiClient "opensource-pulse/api/internal/integrations/gemini"
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
	gemClient := geminiClient.NewClient(cfg.GeminiKey, cfg.GeminiModel)
	orClient := openrouterClient.NewClient(cfg.OpenRouterKey)

	// Auto Migrate
	db.AutoMigrate(
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
	)

	// Repositories
	userRepo := repositories.NewUserRepo(db)
	repoRepo := repositories.NewRepositoryRepo(db)
	techRepo := repositories.NewTechnologyRepo(db)
	reportRepo := repositories.NewReportRepo(db)

	// Services
	authSvc := services.NewAuthService(cfg, userRepo)
	dashboardSvc := services.NewDashboardService(repoRepo, techRepo, reportRepo)
	repoSvc := services.NewRepositoryService(repoRepo)
	radarSvc := services.NewRadarService(techRepo)
	radarCalc := services.NewRadarCalculator(techRepo, db)
	analyticsSvc := services.NewAnalyticsService(repoRepo, techRepo)
	reportSvc := services.NewReportService(reportRepo)

	// Seed default admin user (admin@pulse.com / admin123)
	if err := authSvc.SeedAdminUser(context.Background()); err != nil {
		log.Printf("ERROR: Failed to seed admin user: %v", err)
	}

	// Handlers
	authHandler := handlers.NewAuthHandler(authSvc)
	dashboardHandler := handlers.NewDashboardHandler(dashboardSvc)
	repoHandler := handlers.NewRepositoryHandler(repoSvc)
	radarHandler := handlers.NewRadarHandler(radarSvc, radarCalc)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsSvc)
	reportHandler := handlers.NewReportHandler(reportSvc)

	aiSvc := services.NewAIService(gemClient, orClient, repoRepo, techRepo, db)
	aiHandler := handlers.NewAIHandler(aiSvc)

	healthSvc := services.NewHealthService(ghClient, repoRepo, db)
	healthHandler := handlers.NewHealthHandler(healthSvc)

	syncSvc := services.NewSyncService(cfg, ghClient, repoRepo, techRepo, db, aiSvc, healthSvc)
	syncHandler := handlers.NewSyncHandler(syncSvc)

	insightSvc := services.NewInsightService(gemClient, repoRepo, techRepo, reportRepo)
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
	r.Use(middleware.CORS())
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.HEAD("/health", func(c *gin.Context) {
		c.Status(200)
	})
	api := r.Group("/api")
	{
		// Public Auth
		api.POST("/auth/login", authHandler.Login)
		api.GET("/auth/me", middleware.AuthMiddleware(authSvc), authHandler.Me)

		// Public Reads
		api.GET("/dashboard", dashboardHandler.GetDashboard)
		api.GET("/repositories", repoHandler.ListRepositories)
		api.GET("/repositories/by-name/:owner/:repo", repoHandler.GetRepositoryByOwner)
		api.GET("/repositories/:id", repoHandler.GetRepository)
		api.GET("/repositories/:id/summary", repoHandler.GetSummary)
		api.GET("/repositories/:id/snapshots", repoHandler.GetSnapshots)
		api.GET("/radar", radarHandler.GetRadar)
		api.GET("/analytics", analyticsHandler.GetAnalytics)
		api.GET("/reports", reportHandler.ListReports)
		api.GET("/reports/:id", reportHandler.GetReport)

		// Protected Operations (Requires Admin Token)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(authSvc))
		{
			protected.POST("/sync/repositories", syncHandler.SyncRepositories)
			protected.POST("/radar/calculate", radarHandler.CalculateRadar)
			protected.POST("/repositories/:id/summarize", aiHandler.GenerateSummary)
			protected.POST("/repositories/:id/calculate-health", healthHandler.CalculateHealth)
			protected.POST("/reports/generate-insight", insightHandler.GenerateInsight)
			protected.POST("/reports/generate", insightHandler.GenerateReport)
		}
	}

	log.Printf("Server running on :%s", cfg.ServerPort)
	r.Run(":" + cfg.ServerPort)
}