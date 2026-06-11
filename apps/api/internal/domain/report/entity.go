package report

import (
	"time"

	"gorm.io/datatypes"
)

type WeeklyReport struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Title           string         `gorm:"size:500" json:"title"`
	ReportContent   *string        `json:"report_content,omitempty"`
	TopTechnologies datatypes.JSON `json:"top_technologies,omitempty"`
	TopRepositories datatypes.JSON `json:"top_repositories,omitempty"`
	GeneratedAt     time.Time      `gorm:"index:idx_weekly_report_date" json:"generated_at"`
}

func (WeeklyReport) TableName() string { return "weekly_reports" }

type DailyInsight struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	InsightText string    `json:"insight_text"`
	GeneratedAt time.Time `gorm:"index:idx_daily_insight_date" json:"generated_at"`
}

func (DailyInsight) TableName() string { return "daily_insights" }