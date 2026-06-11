package workers

import (
	"github.com/hibiken/asynq"
)

const (
	TypeSyncRepositories  = "sync:repositories"
	TypeCalculateHealth   = "health:calculate"
	TypeCalculateRadar    = "radar:calculate"
	TypeGenerateInsight   = "insight:generate"
	TypeGenerateReport    = "report:generate"
)

func NewSyncRepositoriesTask() *asynq.Task {
	return asynq.NewTask(TypeSyncRepositories, nil)
}

func NewCalculateHealthTask() *asynq.Task {
	return asynq.NewTask(TypeCalculateHealth, nil)
}

func NewCalculateRadarTask() *asynq.Task {
	return asynq.NewTask(TypeCalculateRadar, nil)
}

func NewGenerateInsightTask() *asynq.Task {
	return asynq.NewTask(TypeGenerateInsight, nil)
}

func NewGenerateReportTask() *asynq.Task {
	return asynq.NewTask(TypeGenerateReport, nil)
}
