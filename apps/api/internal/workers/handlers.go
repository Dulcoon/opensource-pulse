package workers

import (
	"context"
	"log"

	"github.com/hibiken/asynq"
	"opensource-pulse/api/internal/repositories"
	"opensource-pulse/api/internal/services"
)

type Processor struct {
	syncSvc    *services.SyncService
	healthSvc  *services.HealthService
	radarCalc  *services.RadarCalculator
	insightSvc *services.InsightService
	reportSvc  *services.ReportService
	repoRepo   *repositories.RepositoryRepo
}

func NewProcessor(
	syncSvc *services.SyncService,
	healthSvc *services.HealthService,
	radarCalc *services.RadarCalculator,
	insightSvc *services.InsightService,
	reportSvc *services.ReportService,
	repoRepo *repositories.RepositoryRepo,
) *Processor {
	return &Processor{
		syncSvc:    syncSvc,
		healthSvc:  healthSvc,
		radarCalc:  radarCalc,
		insightSvc: insightSvc,
		reportSvc:  reportSvc,
		repoRepo:   repoRepo,
	}
}

func (p *Processor) ProcessSyncRepositories(ctx context.Context, t *asynq.Task) error {
	log.Println("[Worker] Syncing repositories...")
	return p.syncSvc.SyncRepositories(ctx)
}

func (p *Processor) ProcessCalculateHealth(ctx context.Context, t *asynq.Task) error {
	log.Println("[Worker] Calculating health scores for all repos...")
	repos, err := p.repoRepo.FindAll(ctx)
	if err != nil {
		return err
	}
	for _, repo := range repos {
		if _, err := p.healthSvc.CalculateAndSave(ctx, repo.ID); err != nil {
			log.Printf("[Worker] Health score failed for repo %d: %v", repo.ID, err)
		}
	}
	log.Printf("[Worker] Health scores calculated for %d repos", len(repos))
	return nil
}

func (p *Processor) ProcessCalculateRadar(ctx context.Context, t *asynq.Task) error {
	log.Println("[Worker] Calculating tech radar...")
	return p.radarCalc.Calculate(ctx)
}

func (p *Processor) ProcessGenerateInsight(ctx context.Context, t *asynq.Task) error {
	log.Println("[Worker] Generating daily insight...")
	_, err := p.insightSvc.GenerateInsight(ctx)
	return err
}

func (p *Processor) ProcessGenerateReport(ctx context.Context, t *asynq.Task) error {
	log.Println("[Worker] Generating weekly report...")
	_, err := p.insightSvc.GenerateWeeklyReport(ctx)
	return err
}
