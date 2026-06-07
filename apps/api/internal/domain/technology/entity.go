package technology

import "time"

type Technology struct {
	ID             uint   `gorm:"primaryKey"`
	TechnologyName string `gorm:"size:255"`
	Slug           string `gorm:"uniqueIndex;not null;size:255"`
	Category       *string `gorm:"size:100"`
	Description    *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
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
	ID               uint       `gorm:"primaryKey"`
	TechnologyID     uint       `gorm:"not null"`
	Score            *float64   `gorm:"type:numeric(10,2)"`
	GrowthPercentage *float64   `gorm:"type:numeric(10,2)"`
	Status           *string    `gorm:"size:50"`
	RepositoryCount  *int
	CalculatedAt     *time.Time `gorm:"index:idx_technology_date"`
}

func (TechnologyScore) TableName() string { return "technology_scores" }