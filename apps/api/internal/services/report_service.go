package services

import (
	"context"

	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/repositories"
)

type ReportService struct {
	reportRepo *repositories.ReportRepo
}

func NewReportService(reportRepo *repositories.ReportRepo) *ReportService {
	return &ReportService{reportRepo: reportRepo}
}

func (s *ReportService) ListReports(ctx context.Context) ([]report.WeeklyReport, error) {
	return s.reportRepo.FindAllReports(ctx)
}

func (s *ReportService) GetReport(ctx context.Context, id uint) (*report.WeeklyReport, error) {
	return s.reportRepo.FindReportByID(ctx, id)
}