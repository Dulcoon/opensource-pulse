package scheduler

import (
	"log"

	"github.com/hibiken/asynq"
	"opensource-pulse/api/internal/config"
	"opensource-pulse/api/internal/workers"
)

func New(cfg *config.Config) *asynq.Scheduler {
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	scheduler := asynq.NewScheduler(redisOpt, nil)

	scheduler.Register("@every 6h", workers.NewSyncRepositoriesTask())
	scheduler.Register("@every 6h", workers.NewCalculateHealthTask())
	scheduler.Register("@every 6h", workers.NewCalculateRadarTask())
	scheduler.Register("0 8 * * *", workers.NewGenerateInsightTask())
	scheduler.Register("0 9 * * 1", workers.NewGenerateReportTask())

	log.Println("Scheduler registered: sync/health/radar every 6h, insight daily 8AM, report Monday 9AM")
	return scheduler
}
