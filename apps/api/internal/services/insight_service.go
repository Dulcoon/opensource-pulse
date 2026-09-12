package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	geminiClient "opensource-pulse/api/internal/integrations/gemini"
	"opensource-pulse/api/internal/domain/report"
	"opensource-pulse/api/internal/domain/technology"
	"opensource-pulse/api/internal/repositories"
)

type InsightService struct {
	gemini *geminiClient.Client
	repo   *repositories.RepositoryRepo
	tech   *repositories.TechnologyRepo
	rpt    *repositories.ReportRepo
}

func NewInsightService(gemini *geminiClient.Client, repo *repositories.RepositoryRepo, tech *repositories.TechnologyRepo, rpt *repositories.ReportRepo) *InsightService {
	return &InsightService{gemini: gemini, repo: repo, tech: tech, rpt: rpt}
}

// moverLines renders window movers with real measured deltas. A repo with
// growth 0 either did not move or has too few snapshots to measure — the
// prompt marks it as such so the model cannot present it as a mover.
func moverLines(movers []FastestGrowingRepo) string {
	if len(movers) == 0 {
		return "(no measurable movers in this window — too few snapshots)"
	}
	out := ""
	for i, r := range movers {
		note := fmt.Sprintf("+%d stars", r.Growth)
		if r.Growth == 0 {
			note = "no measurable movement (too few snapshots)"
		}
		out += fmt.Sprintf("%d. %s — %s in window, %d total stars, language: %s\n",
			i+1, r.FullName, note, r.Stars, derefStr(r.PrimaryLanguage))
	}
	return out
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func fmtScore(v *float64) string {
	if v == nil {
		return "n/a"
	}
	return fmt.Sprintf("%.1f", *v)
}

func fmtGrowth(v *float64) string {
	if v == nil {
		return "n/a"
	}
	return fmt.Sprintf("%+.1f%%", *v)
}

func fmtCount(v *int) string {
	if v == nil {
		return "n/a"
	}
	return fmt.Sprintf("%d", *v)
}

func techLines(scores []technology.TechnologyScore) string {
	if len(scores) == 0 {
		return "(no radar scores calculated yet)"
	}
	out := ""
	for i, t := range scores {
		name := fmt.Sprintf("Tech #%d", t.TechnologyID)
		if t.Technology != nil && t.Technology.TechnologyName != "" {
			name = t.Technology.TechnologyName
		}
		status := "unknown"
		if t.Status != nil {
			status = *t.Status
		}
		out += fmt.Sprintf("%d. %s — window growth %s, score %s, status %s, %s repos\n",
			i+1, name, fmtGrowth(t.GrowthPercentage), fmtScore(t.Score), status, fmtCount(t.RepositoryCount))
	}
	return out
}

func (s *InsightService) GenerateInsight(ctx context.Context) (*report.DailyInsight, error) {
	log.Println("Generating daily insight with Gemini...")

	window := "7d"
	cutoff := time.Now().Add(-7 * 24 * time.Hour)
	asOf := time.Now().UTC().Format("2006-01-02")

	// Movers with measured window deltas (same numbers the dashboard shows).
	movers := ComputeWindowMovers(s.repo, ctx, 5, cutoff)

	// Latest radar batch for tech context (growth already window-aware is
	// dashboard-side; here we show stored growth and say exactly that).
	scores, _ := s.tech.FindLatestScores(ctx)
	techLimit := 5
	if len(scores) < techLimit {
		techLimit = len(scores)
	}
	topTechs := scores[:techLimit]

	totalRepos, _, _, _ := s.repo.CountStats(ctx)
	if totalRepos == 0 {
		return nil, fmt.Errorf("no repository data: refusing to generate insight without observations")
	}

	prompt := fmt.Sprintf(`Open source telemetry for the trailing %s window (data as of %s):

Top Movers (measured star deltas in window):
%s
Top Technologies (latest radar batch; growth shown is the batch's 7-day figure):
%s
Total repositories tracked: %d

Write ONE concise paragraph (2-3 sentences) of market intelligence. Rules:
- Mention ONLY numbers printed above; never invent percentages, dates, or repo names.
- Repos marked "no measurable movement" must NOT be described as movers.
- If a section says no data, say what is missing instead of guessing.
- Do NOT use LaTeX or formula formatting. Write in English.`,
		window, asOf, moverLines(movers), techLines(topTechs), totalRepos)

	system := "You are an open source market intelligence analyst. Give concise, data-driven insight in English. Just the paragraph, no preamble. Never hallucinate figures."

	text, err := s.gemini.GenerateText(ctx, system, prompt)
	if err != nil {
		return nil, fmt.Errorf("gemini insight error: %w", err)
	}

	insight, err := s.rpt.CreateInsight(ctx, text)
	if err != nil {
		return nil, fmt.Errorf("save insight: %w", err)
	}

	log.Printf("Daily insight generated: %.50s...", text)
	return insight, nil
}

func (s *InsightService) GenerateWeeklyReport(ctx context.Context) (*report.WeeklyReport, error) {
	log.Println("Generating weekly report with Gemini...")

	window := "7d"
	cutoff := time.Now().Add(-7 * 24 * time.Hour)
	asOf := time.Now().UTC().Format("2006-01-02")

	movers := ComputeWindowMovers(s.repo, ctx, 10, cutoff)

	scores, _ := s.tech.FindLatestScores(ctx)
	techLimit := 10
	if len(scores) < techLimit {
		techLimit = len(scores)
	}
	top10Techs := scores[:techLimit]

	totalRepos, _, _, _ := s.repo.CountStats(ctx)
	if totalRepos == 0 {
		return nil, fmt.Errorf("no repository data: refusing to generate report without observations")
	}

	prompt := fmt.Sprintf(`Open source telemetry for the trailing %s window (data as of %s):

Top Movers (measured star deltas in window):
%s
Top Technologies (latest radar batch; growth shown is the batch's 7-day figure):
%s
Total repositories tracked: %d

Write a weekly executive intelligence report (3-4 paragraphs) analyzing:
1. Overall ecosystem market trends
2. Most notable breakout repositories and why they matter
3. Technology sector movements (rising vs declining)
4. Strategic outlook for the coming week

Rules: mention ONLY numbers printed above; never invent percentages, dates, or repo names. Repos marked "no measurable movement" must NOT be described as breakouts. If a section has no data, say so instead of guessing. Be specific, data-driven, and write in professional English. Do NOT use LaTeX or formula formatting.`,
		window, asOf, moverLines(movers), techLines(top10Techs), totalRepos)

	system := "You are an open source market intelligence analyst writing an executive report. Write in professional English. Be specific and data-driven. Never hallucinate figures."

	text, err := s.gemini.GenerateText(ctx, system, prompt)
	if err != nil {
		return nil, fmt.Errorf("gemini weekly report error: %w", err)
	}

	topTechJSON, _ := json.Marshal(top10Techs)
	topRepoJSON, _ := json.Marshal(movers)

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
