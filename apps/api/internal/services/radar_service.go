package services

import (
	"context"

	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"
)

type RadarService struct {
	techRepo *repositories.TechnologyRepo
}

func NewRadarService(techRepo *repositories.TechnologyRepo) *RadarService {
	return &RadarService{techRepo: techRepo}
}

func (s *RadarService) GetRadar(ctx context.Context) ([]technology.TechnologyScore, error) {
	return s.techRepo.FindLatestScores(ctx)
}