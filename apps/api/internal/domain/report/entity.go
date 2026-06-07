package report

import (
	"time"

	"gorm.io/datatypes"
)

type WeeklyReport struct {
	ID              uint           `gorm:"primaryKey"`
	Title           string         `gorm:"size:500"`
	ReportContent   *string
	TopTechnologies datatypes.JSON
	TopRepositories datatypes.JSON
	GeneratedAt     time.Time      `gorm:"index:idx_weekly_report_date"`
}

func (WeeklyReport) TableName() string { return "weekly_reports" }

type DailyInsight struct {
	ID          uint      `gorm:"primaryKey"`
	InsightText string
	GeneratedAt time.Time `gorm:"index:idx_daily_insight_date"`
}

func (DailyInsight) TableName() string { return "daily_insights" }