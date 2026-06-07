package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"opensource-pulse/api/internal/domain/ai"
	"opensource-pulse/api/internal/domain/repository"
	groqClient "opensource-pulse/api/internal/integrations/groq"
	openrouterClient "opensource-pulse/api/internal/integrations/openrouter"
	"opensource-pulse/api/internal/repositories"

	"gorm.io/gorm"
)

type AIService struct {
	groq       *groqClient.Client
	openrouter *openrouterClient.Client
	repo       *repositories.RepositoryRepo
	tech       *repositories.TechnologyRepo
	db         *gorm.DB
}

func NewAIService(groq *groqClient.Client, openrouter *openrouterClient.Client, repo *repositories.RepositoryRepo, tech *repositories.TechnologyRepo, db *gorm.DB) *AIService {
	return &AIService{groq: groq, openrouter: openrouter, repo: repo, tech: tech, db: db}
}

func (s *AIService) GenerateSummary(ctx context.Context, repoID uint) (*ai.SummaryResult, error) {
	r, err := s.repo.FindByID(ctx, repoID)
	if err != nil {
		return nil, err
	}

	topics, err := s.tech.FindNamesByRepoID(ctx, repoID)
	if err != nil {
		topics = []string{}
	}

	desc := ""
	if r.Description != nil {
		desc = *r.Description
	}

	log.Printf("Generating summary for %s...", r.FullName)

	// Primary: Groq
	result, err := s.groq.GenerateSummary(ctx, r.FullName, desc, topics)
	if err != nil {
		log.Printf("Groq failed: %v, trying OpenRouter...", err)
		// Fallback: OpenRouter
		result, err = s.openrouter.GenerateSummary(ctx, r.FullName, desc, topics)
		if err != nil {
			return nil, fmt.Errorf("all AI providers failed: %w", err)
		}
	}

	keyFeatures, _ := json.Marshal(result.KeyFeatures)
	useCases, _ := json.Marshal(result.UseCases)
	similarProjects, _ := json.Marshal(result.SimilarProjects)

	now := time.Now()
	modelName := "groq"
	summary := repository.RepositorySummary{
		RepositoryID:    repoID,
		QuickSummary:    &result.QuickSummary,
		KeyFeatures:     keyFeatures,
		UseCases:        useCases,
		SimilarProjects: similarProjects,
		DifficultyLevel: &result.DifficultyLevel,
		ModelName:       &modelName,
		GeneratedAt:     &now,
	}

	s.db.Where("repository_id = ?", repoID).Delete(&repository.RepositorySummary{})

	if err := s.db.Create(&summary).Error; err != nil {
		return nil, err
	}

	log.Printf("Summary saved for %s", r.FullName)
	return result, nil
}
