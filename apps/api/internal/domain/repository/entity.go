package repository

import (
	"time"

	"gorm.io/datatypes"
)

type Repository struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	GithubID        int64      `gorm:"uniqueIndex;not null" json:"github_id"`
	Owner           string     `gorm:"not null" json:"owner"`
	RepositoryName  string     `gorm:"not null" json:"repository_name"`
	FullName        string     `gorm:"not null;size:500" json:"full_name"`
	Description     *string    `json:"description,omitempty"`
	PrimaryLanguage *string    `gorm:"size:100" json:"primary_language,omitempty"`
	Stars           int        `gorm:"default:0" json:"stars"`
	Forks           int        `gorm:"default:0" json:"forks"`
	OpenIssues      int        `gorm:"default:0" json:"open_issues"`
	Watchers        int        `gorm:"default:0" json:"watchers"`
	RepositoryURL   *string    `json:"repository_url,omitempty"`
	DefaultBranch   *string    `gorm:"size:100" json:"default_branch,omitempty"`
	LastReleaseAt   *time.Time `json:"last_release_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (Repository) TableName() string { return "repositories" }

type RepositorySnapshot struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	RepositoryID uint      `gorm:"not null;index:idx_snapshots_repository" json:"repository_id"`
	Stars        int       `json:"stars"`
	Forks        int       `json:"forks"`
	OpenIssues   int       `json:"open_issues"`
	Contributors int       `json:"contributors"`
	CapturedAt   time.Time `gorm:"not null;index:idx_snapshots_date" json:"captured_at"`
}

func (RepositorySnapshot) TableName() string { return "repository_snapshots" }

type RepositorySummary struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	RepositoryID    uint            `gorm:"uniqueIndex;not null" json:"repository_id"`
	QuickSummary    *string         `json:"quick_summary,omitempty"`
	KeyFeatures     datatypes.JSON  `json:"key_features,omitempty"`
	UseCases        datatypes.JSON  `json:"use_cases,omitempty"`
	SimilarProjects datatypes.JSON  `json:"similar_projects,omitempty"`
	DifficultyLevel *string         `gorm:"size:50" json:"difficulty_level,omitempty"`
	ModelName       *string         `gorm:"size:100" json:"model_name,omitempty"`
	GeneratedAt     *time.Time      `json:"generated_at,omitempty"`
}

func (RepositorySummary) TableName() string { return "repository_summaries" }

type RepositoryHealthScore struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	RepositoryID     uint       `gorm:"uniqueIndex;not null" json:"repository_id"`
	OverallScore     *float64   `gorm:"type:numeric(5,2)" json:"overall_score,omitempty"`
	ActivityScore    *float64   `gorm:"type:numeric(5,2)" json:"activity_score,omitempty"`
	MaintenanceScore *float64   `gorm:"type:numeric(5,2)" json:"maintenance_score,omitempty"`
	CommunityScore   *float64   `gorm:"type:numeric(5,2)" json:"community_score,omitempty"`
	IssueScore       *float64   `gorm:"type:numeric(5,2)" json:"issue_score,omitempty"`
	Status           *string    `gorm:"size:50" json:"status,omitempty"`
	CalculatedAt     *time.Time `json:"calculated_at,omitempty"`
}

func (RepositoryHealthScore) TableName() string { return "repository_health_scores" }
