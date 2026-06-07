package ai

type SummaryResult struct {
	QuickSummary    string   `json:"quick_summary"`
	KeyFeatures     []string `json:"key_features"`
	UseCases        []string `json:"use_cases"`
	SimilarProjects []string `json:"similar_projects"`
	DifficultyLevel string   `json:"difficulty_level"`
}
