package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"opensource-pulse/api/internal/domain/ai"
	"opensource-pulse/api/internal/domain/repository"
	geminiClient "opensource-pulse/api/internal/integrations/gemini"
	openrouterClient "opensource-pulse/api/internal/integrations/openrouter"
	"opensource-pulse/api/internal/repositories"

	"gorm.io/gorm"
)

type AIService struct {
	gemini     *geminiClient.Client
	openrouter *openrouterClient.Client
	repo       *repositories.RepositoryRepo
	tech       *repositories.TechnologyRepo
	db         *gorm.DB
}

func NewAIService(gemini *geminiClient.Client, openrouter *openrouterClient.Client, repo *repositories.RepositoryRepo, tech *repositories.TechnologyRepo, db *gorm.DB) *AIService {
	return &AIService{gemini: gemini, openrouter: openrouter, repo: repo, tech: tech, db: db}
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

	// Primary: Google Gemini
	modelName := "gemini"
	result, err := s.gemini.GenerateSummary(ctx, r.FullName, desc, topics)
	if err != nil {
		log.Printf("Gemini failed: %v, trying OpenRouter fallback...", err)
		// Fallback: OpenRouter
		modelName = "openrouter"
		result, err = s.openrouter.GenerateSummary(ctx, r.FullName, desc, topics)
		if err != nil {
			return nil, fmt.Errorf("all AI providers failed: %w", err)
		}
	}

	keyFeatures, _ := json.Marshal(result.KeyFeatures)
	useCases, _ := json.Marshal(result.UseCases)
	similarProjects, _ := json.Marshal(result.SimilarProjects)

	now := time.Now()
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

	log.Printf("Summary saved for %s using %s", r.FullName, modelName)
	return result, nil
}
