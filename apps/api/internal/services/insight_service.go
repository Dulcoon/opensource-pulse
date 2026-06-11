package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	groqClient "opensource-pulse/api/internal/integrations/groq"
	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/repositories"
)

type InsightService struct {
	groq *groqClient.Client
	repo *repositories.RepositoryRepo
	tech *repositories.TechnologyRepo
	rpt  *repositories.ReportRepo
}

func NewInsightService(groq *groqClient.Client, repo *repositories.RepositoryRepo, tech *repositories.TechnologyRepo, rpt *repositories.ReportRepo) *InsightService {
	return &InsightService{groq: groq, repo: repo, tech: tech, rpt: rpt}
}

func (s *InsightService) GenerateInsight(ctx context.Context) (*report.DailyInsight, error) {
	log.Println("Generating daily insight...")

	// Ambil top 5 repos
	topRepos, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetch repos: %w", err)
	}
	limit := 5
	if len(topRepos) < limit {
		limit = len(topRepos)
	}
	top5 := topRepos[:limit]

	// Ambil top 5 tech radar
	scores, _ := s.tech.FindLatestScores(ctx)
	techLimit := 5
	if len(scores) < techLimit {
		techLimit = len(scores)
	}
	topTechs := scores[:techLimit]

	// Bangun prompt
	repoSummary := ""
	for i, r := range top5 {
		lang := ""
		if r.PrimaryLanguage != nil {
			lang = *r.PrimaryLanguage
		}
		repoSummary += fmt.Sprintf("%d. %s — %s, stars: %d, language: %s\n", i+1, r.FullName, safeStr(r.Description), r.Stars, lang)
	}

	techSummary := ""
	for i, t := range topTechs {
		techSummary += fmt.Sprintf("%d. tech_id=%d, score=%.1f, repos=%d\n", i+1, t.TechnologyID, *t.Score, *t.RepositoryCount)
	}

	prompt := fmt.Sprintf(`Today's open source landscape data:

Top Repositories:
%s

Top Technologies (Tech Radar):
%s

Total repositories tracked: %d

Based on this data, write ONE paragraph (2-3 sentences) of insight about current open source trends. Be specific and data-driven.`,
		repoSummary, techSummary, len(topRepos))

	system := "You are an open source intelligence analyst. Give concise, data-driven insight in Indonesian language. Just the paragraph, no preamble."

	text, err := s.groq.GenerateText(ctx, system, prompt)
	if err != nil {
		return nil, fmt.Errorf("groq insight: %w", err)
	}

	insight, err := s.rpt.CreateInsight(ctx, text)
	if err != nil {
		return nil, fmt.Errorf("save insight: %w", err)
	}

	log.Printf("Daily insight generated: %.50s...", text)
	return insight, nil
}

func (s *InsightService) GenerateWeeklyReport(ctx context.Context) (*report.WeeklyReport, error) {
	log.Println("Generating weekly report...")

	topRepos, _ := s.repo.FindAll(ctx)
	reposLimit := 10
	if len(topRepos) < reposLimit {
		reposLimit = len(topRepos)
	}
	top10Repos := topRepos[:reposLimit]

	scores, _ := s.tech.FindLatestScores(ctx)
	techLimit := 10
	if len(scores) < techLimit {
		techLimit = len(scores)
	}
	top10Techs := scores[:techLimit]

	repoSummary := ""
	for i, r := range top10Repos {
		lang := ""
		if r.PrimaryLanguage != nil {
			lang = *r.PrimaryLanguage
		}
		repoSummary += fmt.Sprintf("%d. %s — %s, stars: %d, language: %s\n", i+1, r.FullName, safeStr(r.Description), r.Stars, lang)
	}

	techSummary := ""
	for i, t := range top10Techs {
		techSummary += fmt.Sprintf("%d. tech_id=%d, score=%.1f, repos=%d\n", i+1, t.TechnologyID, *t.Score, *t.RepositoryCount)
	}

	prompt := fmt.Sprintf(`This week's open source landscape data:

Top Repositories (by stars):
%s

Top Technologies (Tech Radar):
%s

Total repositories tracked: %d

Write a weekly report (3-4 paragraphs) analyzing:
1. Overall ecosystem trends
2. Most notable repositories and why they matter
3. Technology movements (rising/declining)
4. Outlook for next week

Be specific, data-driven, and write in Indonesian.`,
		repoSummary, techSummary, len(topRepos))

	system := "You are an open source intelligence analyst writing a weekly report. Write in Indonesian language. Be specific and data-driven."

	text, err := s.groq.GenerateText(ctx, system, prompt)
	if err != nil {
		return nil, fmt.Errorf("groq weekly report: %w", err)
	}

	topTechJSON, _ := json.Marshal(top10Techs)
	topRepoJSON, _ := json.Marshal(top10Repos)

	report, err := s.rpt.CreateReport(ctx, "Weekly Open Source Report", &text, topTechJSON, topRepoJSON)
	if err != nil {
		return nil, fmt.Errorf("save report: %w", err)
	}

	log.Printf("Weekly report generated: %d chars", len(text))
	return report, nil
}

func safeStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
