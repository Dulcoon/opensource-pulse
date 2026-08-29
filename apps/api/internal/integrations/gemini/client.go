package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"opensource-pulse/api/internal/domain/ai"
)

type Client struct {
	apiKey string
	client *http.Client
	models []string
}

type GeminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiInstruction struct {
	Parts []GeminiPart `json:"parts"`
}

type GenerationConfig struct {
	Temperature      float64 `json:"temperature,omitempty"`
	ResponseMimeType string  `json:"responseMimeType,omitempty"`
}

type GeminiRequest struct {
	SystemInstruction *GeminiInstruction `json:"system_instruction,omitempty"`
	Contents          []GeminiContent    `json:"contents"`
	GenerationConfig  *GenerationConfig  `json:"generationConfig,omitempty"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
			Role string `json:"role"`
		} `json:"content"`
		FinishReason string `json:"finishReason"`
	} `json:"candidates"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error,omitempty"`
}

func NewClient(apiKey string, primaryModel string) *Client {
	if primaryModel == "" {
		primaryModel = "gemini-2.5-flash"
	}

	modelList := []string{primaryModel}
	for _, m := range []string{"gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"} {
		if m != primaryModel {
			modelList = append(modelList, m)
		}
	}

	return &Client{
		apiKey: apiKey,
		client: &http.Client{Timeout: 60 * time.Second},
		models: modelList,
	}
}

func (c *Client) GenerateSummary(ctx context.Context, repoName, description string, topics []string) (*ai.SummaryResult, error) {
	prompt := fmt.Sprintf(`Analyze this GitHub repository and return JSON only:

Repository: %s
Description: %s
Topics: %v

Return JSON with this exact structure:
{
  "quick_summary": "2-3 sentence explanation",
  "key_features": ["feature1", "feature2", "feature3"],
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "similar_projects": ["similar project 1", "similar project 2"],
  "difficulty_level": "Beginner/Intermediate/Advanced"
}`, repoName, description, topics)

	systemInstruction := &GeminiInstruction{
		Parts: []GeminiPart{
			{Text: "You are a technical open source analyst. Return valid JSON only."},
		},
	}

	contents := []GeminiContent{
		{
			Role: "user",
			Parts: []GeminiPart{
				{Text: prompt},
			},
		},
	}

	genConfig := &GenerationConfig{
		Temperature:      0.2,
		ResponseMimeType: "application/json",
	}

	var lastErr error
	for _, model := range c.models {
		raw, err := c.callGemini(ctx, model, systemInstruction, contents, genConfig)
		if err == nil {
			result, parseErr := parseJSON(raw)
			if parseErr == nil {
				return result, nil
			}
			lastErr = parseErr
		} else {
			lastErr = err
		}
	}

	return nil, fmt.Errorf("all Gemini models failed: %w", lastErr)
}

func (c *Client) GenerateText(ctx context.Context, system, userPrompt string) (string, error) {
	var systemInstruction *GeminiInstruction
	if system != "" {
		systemInstruction = &GeminiInstruction{
			Parts: []GeminiPart{
				{Text: system},
			},
		}
	}

	contents := []GeminiContent{
		{
			Role: "user",
			Parts: []GeminiPart{
				{Text: userPrompt},
			},
		},
	}

	genConfig := &GenerationConfig{
		Temperature: 0.3,
	}

	var lastErr error
	for _, model := range c.models {
		text, err := c.callGemini(ctx, model, systemInstruction, contents, genConfig)
		if err == nil {
			return text, nil
		}
		lastErr = err
	}

	return "", fmt.Errorf("all Gemini models failed: %w", lastErr)
}

func (c *Client) callGemini(
	ctx context.Context,
	model string,
	system *GeminiInstruction,
	contents []GeminiContent,
	genConfig *GenerationConfig,
) (string, error) {
	if c.apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	reqPayload := GeminiRequest{
		SystemInstruction: system,
		Contents:          contents,
		GenerationConfig:  genConfig,
	}

	body, err := json.Marshal(reqPayload)
	if err != nil {
		return "", fmt.Errorf("marshal gemini request: %w", err)
	}

	endpoint := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent",
		model,
	)

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create gemini request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini %s network error: %w", model, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read gemini response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini %s status %d: %s", model, resp.StatusCode, string(respBody))
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", fmt.Errorf("unmarshal gemini response: %w", err)
	}

	if geminiResp.Error != nil {
		return "", fmt.Errorf("gemini API error (%d): %s", geminiResp.Error.Code, geminiResp.Error.Message)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini %s returned no candidates", model)
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

func parseJSON(raw string) (*ai.SummaryResult, error) {
	start, end := 0, len(raw)
	for i := 0; i < len(raw); i++ {
		if raw[i] == '{' {
			start = i
			break
		}
	}
	for i := len(raw) - 1; i >= 0; i-- {
		if raw[i] == '}' {
			end = i + 1
			break
		}
	}

	if start >= end {
		return nil, fmt.Errorf("no valid JSON object found in output")
	}

	var result ai.SummaryResult
	if err := json.Unmarshal([]byte(raw[start:end]), &result); err != nil {
		return nil, fmt.Errorf("parse error: %w\nraw: %s", err, raw[start:end])
	}

	if result.QuickSummary == "" || len(result.KeyFeatures) == 0 {
		return nil, fmt.Errorf("incomplete summary payload from AI")
	}

	return &result, nil
}
