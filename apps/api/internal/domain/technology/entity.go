package technology

import "time"

type Technology struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	TechnologyName string    `gorm:"size:255" json:"technology_name"`
	Slug           string    `gorm:"uniqueIndex;not null;size:255" json:"slug"`
	Category       *string   `gorm:"size:100" json:"category,omitempty"`
	Description    *string   `json:"description,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (Technology) TableName() string { return "technologies" }

type RepositoryTechnology struct {
	ID           uint      `gorm:"primaryKey"`
	RepositoryID uint      `gorm:"uniqueIndex:idx_repo_tech;not null"`
	TechnologyID uint      `gorm:"uniqueIndex:idx_repo_tech;not null"`
	CreatedAt    time.Time
}

func (RepositoryTechnology) TableName() string { return "repository_technologies" }

type TechnologyScore struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	TechnologyID     uint       `gorm:"not null" json:"technology_id"`
	Score            *float64   `gorm:"type:numeric(10,2)" json:"score,omitempty"`
	GrowthPercentage *float64   `gorm:"type:numeric(10,2)" json:"growth_percentage,omitempty"`
	Status           *string    `gorm:"size:50" json:"status,omitempty"`
	RepositoryCount  *int       `json:"repository_count,omitempty"`
	CalculatedAt     *time.Time `gorm:"index:idx_technology_date" json:"calculated_at,omitempty"`
}

func (TechnologyScore) TableName() string { return "technology_scores" }