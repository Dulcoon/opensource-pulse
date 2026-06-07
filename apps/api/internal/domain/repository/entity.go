package repository

import (
	"time"

	"gorm.io/datatypes"
)

type Repository struct {
	ID              uint       `gorm:"primaryKey"`
	GithubID        int64      `gorm:"uniqueIndex;not null"`
	Owner           string     `gorm:"not null"`
	RepositoryName  string     `gorm:"not null"`
	FullName        string     `gorm:"not null;size:500"`
	Description     *string
	PrimaryLanguage *string    `gorm:"size:100"`
	Stars           int        `gorm:"default:0"`
	Forks           int        `gorm:"default:0"`
	OpenIssues      int        `gorm:"default:0"`
	Watchers        int        `gorm:"default:0"`
	RepositoryURL   *string
	DefaultBranch   *string    `gorm:"size:100"`
	LastReleaseAt   *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (Repository) TableName() string { return "repositories" }

type RepositorySnapshot struct {
	ID           uint      `gorm:"primaryKey"`
	RepositoryID uint      `gorm:"not null;index:idx_snapshots_repository"`
	Stars        int
	Forks        int
	OpenIssues   int
	Contributors int
	CapturedAt   time.Time `gorm:"not null;index:idx_snapshots_date"`
}

func (RepositorySnapshot) TableName() string { return "repository_snapshots" }

type RepositorySummary struct {
	ID              uint            `gorm:"primaryKey"`
	RepositoryID    uint            `gorm:"uniqueIndex;not null"`
	QuickSummary    *string
	KeyFeatures     datatypes.JSON
	UseCases        datatypes.JSON
	SimilarProjects datatypes.JSON
	DifficultyLevel *string         `gorm:"size:50"`
	ModelName       *string         `gorm:"size:100"`
	GeneratedAt     *time.Time
}

func (RepositorySummary) TableName() string { return "repository_summaries" }

type RepositoryHealthScore struct {
	ID               uint       `gorm:"primaryKey"`
	RepositoryID     uint       `gorm:"uniqueIndex;not null"`
	OverallScore     *float64   `gorm:"type:numeric(5,2)"`
	ActivityScore    *float64   `gorm:"type:numeric(5,2)"`
	MaintenanceScore *float64   `gorm:"type:numeric(5,2)"`
	CommunityScore   *float64   `gorm:"type:numeric(5,2)"`
	IssueScore       *float64   `gorm:"type:numeric(5,2)"`
	Status           *string    `gorm:"size:50"`
	CalculatedAt     *time.Time
}

func (RepositoryHealthScore) TableName() string { return "repository_health_scores" }
