package repositories

import (
	"context"
	"errors"
	"time"

	"opensource-pulse/api/internal/domain/report"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ReportRepo struct {
	db *gorm.DB
}

func NewReportRepo(db *gorm.DB) *ReportRepo {
	return &ReportRepo{db: db}
}

func (r *ReportRepo) FindAllReports(ctx context.Context) ([]report.WeeklyReport, error) {
	var reports []report.WeeklyReport
	err := r.db.WithContext(ctx).Order("generated_at desc").Find(&reports).Error
	return reports, err
}

func (r *ReportRepo) FindReportByID(ctx context.Context, id uint) (*report.WeeklyReport, error) {
	var rpt report.WeeklyReport
	err := r.db.WithContext(ctx).First(&rpt, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &rpt, err
}

func (r *ReportRepo) CreateInsight(ctx context.Context, text string) (*report.DailyInsight, error) {
	insight := report.DailyInsight{
		InsightText: text,
		GeneratedAt: time.Now(),
	}
	err := r.db.WithContext(ctx).Create(&insight).Error
	return &insight, err
}

func (r *ReportRepo) CreateReport(ctx context.Context, title string, content *string, topTech, topRepo datatypes.JSON) (*report.WeeklyReport, error) {
	rpt := report.WeeklyReport{
		Title:           title,
		ReportContent:   content,
		TopTechnologies: topTech,
		TopRepositories: topRepo,
		GeneratedAt:     time.Now(),
	}
	err := r.db.WithContext(ctx).Create(&rpt).Error
	return &rpt, err
}

func (r *ReportRepo) FindLatestInsight(ctx context.Context) (*report.DailyInsight, error) {
	var insight report.DailyInsight
	err := r.db.WithContext(ctx).Order("generated_at desc").First(&insight).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &insight, err
}