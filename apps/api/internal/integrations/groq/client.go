package groq

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

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type ChatResponse struct {
	Choices []Choice `json:"choices"`
}

type Choice struct {
	Message Message `json:"message"`
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		client: &http.Client{Timeout: 60 * time.Second},
		models: []string{
			"llama-3.3-70b-versatile",
			"llama-3.1-8b-instant",
		},
	}
}

func (c *Client) GenerateSummary(ctx context.Context, repoName, description string, topics []string) (*ai.SummaryResult, error) {
	prompt := fmt.Sprintf(`Analyze this GitHub repository and return JSON only (no markdown):

Repository: %s
Description: %s
Topics: %v

Return JSON with this structure:
{
  "quick_summary": "2-3 sentence explanation",
  "key_features": ["feature1", "feature2", "feature3"],
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "similar_projects": ["similar project 1", "similar project 2"],
  "difficulty_level": "Beginner/Intermediate/Advanced"
}`, repoName, description, topics)

	messages := []Message{
		{Role: "system", Content: "You are a technical analyst. Return valid JSON only, no markdown formatting."},
		{Role: "user", Content: prompt},
	}

	var lastErr error
	for _, model := range c.models {
		result, err := c.callModel(ctx, model, messages)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}

	return nil, fmt.Errorf("all Groq models failed: %w", lastErr)
}

func (c *Client) GenerateText(ctx context.Context, system, user string) (string, error) {
	messages := []Message{
		{Role: "system", Content: system},
		{Role: "user", Content: user},
	}

	var lastErr error
	for _, model := range c.models {
		resp, err := c.callText(ctx, model, messages)
		if err == nil {
			return resp, nil
		}
		lastErr = err
	}
	return "", fmt.Errorf("all Groq models failed: %w", lastErr)
}

func (c *Client) callText(ctx context.Context, model string, messages []Message) (string, error) {
	reqBody := ChatRequest{Model: model, Messages: messages}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("request error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("groq %s request failed: %w", model, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read error: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("groq %s status %d: %s", model, resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("unmarshal error: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("groq %s: no choices", model)
	}

	return chatResp.Choices[0].Message.Content, nil
}

func (c *Client) callModel(ctx context.Context, model string, messages []Message) (*ai.SummaryResult, error) {
	reqBody := ChatRequest{Model: model, Messages: messages}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("request error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("groq %s request failed: %w", model, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read error: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("groq %s status %d: %s", model, resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return nil, fmt.Errorf("unmarshal error: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return nil, fmt.Errorf("groq %s: no choices", model)
	}

	return parseJSON(chatResp.Choices[0].Message.Content)
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

	var result ai.SummaryResult
	if err := json.Unmarshal([]byte(raw[start:end]), &result); err != nil {
		return nil, fmt.Errorf("parse error: %w\nraw: %s", err, raw[start:end])
	}

	if result.QuickSummary == "" || len(result.KeyFeatures) == 0 {
		return nil, fmt.Errorf("incomplete summary from Groq")
	}

	return &result, nil
}
