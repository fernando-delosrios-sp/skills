package jev

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatCompletionRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens"`
}

type ChatCompletionResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
}

type Classifier struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewClassifier(cfg *config.Config) *Classifier {
	return &Classifier{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (c *Classifier) Classify(ctx context.Context, prompt string) (tiers.TierName, string, error) {
	// Try local / configured Jev endpoint first
	if c.cfg.Jev.Endpoint != "" {
		tier, reason, err := c.classifyWithEndpoint(ctx, prompt)
		if err == nil {
			return tier, reason, nil
		}
	}

	// Fallback to heuristic classification
	tier, reason := ClassifyWithHeuristics(prompt)
	return tier, reason, nil
}

func (c *Classifier) SelectModel(ctx context.Context, prompt string, candidates []string, defaultEffort string) (string, string, error) {
	if defaultEffort == "" {
		defaultEffort = "medium"
	}
	if len(candidates) == 0 {
		return "", defaultEffort, fmt.Errorf("no candidate models provided")
	}
	if len(candidates) == 1 || c.cfg.Jev.Endpoint == "" {
		return candidates[0], defaultEffort, nil
	}

	endpoint := strings.TrimRight(c.cfg.Jev.Endpoint, "/")
	if !strings.HasSuffix(endpoint, "/chat/completions") {
		endpoint += "/chat/completions"
	}

	var candidateList strings.Builder
	for i, m := range candidates {
		fmt.Fprintf(&candidateList, "%d. %s\n", i+1, m)
	}

	reqBody := ChatCompletionRequest{
		Model: c.cfg.Jev.Model,
		Messages: []ChatMessage{
			{
				Role: "system",
				Content: "You are an AI model selector for a software engineering task.\n" +
					"Given the task prompt and candidate base models:\n" +
					"1. Select the single best base model from the candidates.\n" +
					"2. Select reasoning effort: \"low\", \"medium\", or \"high\" based on task complexity (low for simple/typos, medium for features/refactoring, high for deep/complex architecture).\n" +
					"When choosing among OpenCode models, favour opencode-go/ subscription models over opencode/ (Zen) models.\n\n" +
					"Respond in this exact two-line format:\n" +
					"Model: <exact base model from candidates>\n" +
					"Effort: <low|medium|high>",
			},
			{
				Role: "user",
				Content: fmt.Sprintf("Task prompt:\n%s\n\nCandidate base models:\n%s\nSelection:", prompt, candidateList.String()),
			},
		},
		Temperature: 0.0,
		MaxTokens:   60,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return candidates[0], defaultEffort, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(data))
	if err != nil {
		return candidates[0], defaultEffort, err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.cfg.Jev.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.cfg.Jev.APIKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return candidates[0], defaultEffort, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return candidates[0], defaultEffort, fmt.Errorf("model selector returned status %d", resp.StatusCode)
	}

	var chatResp ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return candidates[0], defaultEffort, err
	}

	if len(chatResp.Choices) == 0 {
		return candidates[0], defaultEffort, fmt.Errorf("no choices returned by model selector")
	}

	raw := strings.TrimSpace(chatResp.Choices[0].Message.Content)
	selectedModel := candidates[0]
	selectedEffort := defaultEffort

	lines := strings.Split(raw, "\n")
	modelFound := false
	for _, line := range lines {
		line = strings.TrimSpace(line)
		lower := strings.ToLower(line)
		if strings.HasPrefix(lower, "model:") {
			val := strings.TrimSpace(line[6:])
			for _, m := range candidates {
				if strings.EqualFold(val, m) || strings.Contains(strings.ToLower(val), strings.ToLower(m)) {
					selectedModel = m
					modelFound = true
					break
				}
			}
		} else if strings.HasPrefix(lower, "effort:") {
			val := strings.TrimSpace(lower[7:])
			if strings.Contains(val, "high") {
				selectedEffort = "high"
			} else if strings.Contains(val, "low") {
				selectedEffort = "low"
			} else if strings.Contains(val, "medium") {
				selectedEffort = "medium"
			}
		}
	}

	if !modelFound {
		for _, m := range candidates {
			if strings.EqualFold(raw, m) || strings.Contains(strings.ToLower(raw), strings.ToLower(m)) {
				selectedModel = m
				break
			}
		}
	}

	lowerRaw := strings.ToLower(raw)
	if strings.Contains(lowerRaw, "effort: high") || strings.Contains(lowerRaw, "effort:high") {
		selectedEffort = "high"
	} else if strings.Contains(lowerRaw, "effort: low") || strings.Contains(lowerRaw, "effort:low") {
		selectedEffort = "low"
	} else if strings.Contains(lowerRaw, "effort: medium") || strings.Contains(lowerRaw, "effort:medium") {
		selectedEffort = "medium"
	}

	return selectedModel, selectedEffort, nil
}

func (c *Classifier) classifyWithEndpoint(ctx context.Context, prompt string) (tiers.TierName, string, error) {
	endpoint := strings.TrimRight(c.cfg.Jev.Endpoint, "/")
	if !strings.HasSuffix(endpoint, "/chat/completions") {
		endpoint += "/chat/completions"
	}

	reqBody := ChatCompletionRequest{
		Model: c.cfg.Jev.Model,
		Messages: []ChatMessage{
			{
				Role: "system",
				Content: "You are a software engineering task complexity classifier. " +
					"Classify the given task into exactly one category: 'frontier' (complex architectural redesign, difficult algorithms, multi-file refactoring, deep debugging), " +
					"'workhorse' (standard features, unit tests, component creation, refactoring), or " +
					"'lightweight' (simple typos, single function tweaks, documentation, small fixes). " +
					"Respond with ONLY the tier word in lowercase.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.0,
		MaxTokens:   10,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(data))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.cfg.Jev.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.cfg.Jev.APIKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("classifier returned status %d: %s", resp.StatusCode, string(body))
	}

	var chatResp ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", "", err
	}

	if len(chatResp.Choices) == 0 {
		return "", "", fmt.Errorf("no response choices returned by classifier")
	}

	raw := strings.ToLower(strings.TrimSpace(chatResp.Choices[0].Message.Content))
	if strings.Contains(raw, "frontier") {
		return tiers.TierFrontier, "scored by Jev endpoint as frontier", nil
	} else if strings.Contains(raw, "lightweight") {
		return tiers.TierLightweight, "scored by Jev endpoint as lightweight", nil
	} else if strings.Contains(raw, "workhorse") {
		return tiers.TierWorkhorse, "scored by Jev endpoint as workhorse", nil
	}

	return tiers.TierWorkhorse, "defaulted from ambiguous Jev output: " + raw, nil
}

func ClassifyWithHeuristics(prompt string) (tiers.TierName, string) {
	lower := strings.ToLower(prompt)

	frontierKeywords := []string{
		"architect", "redesign", "migration", "race condition", "deadlock",
		"concurrency", "distributed", "security audit", "vulnerability",
		"performance profiling", "memory leak",
	}
	for _, kw := range frontierKeywords {
		if strings.Contains(lower, kw) {
			return tiers.TierFrontier, fmt.Sprintf("heuristic match on keyword '%s'", kw)
		}
	}

	lightweightKeywords := []string{
		"typo", "rename variable", "fix spelling", "docstring", "comment",
		"readme tweak", "linter warning", "bump version",
	}
	for _, kw := range lightweightKeywords {
		if strings.Contains(lower, kw) {
			return tiers.TierLightweight, fmt.Sprintf("heuristic match on keyword '%s'", kw)
		}
	}

	if len(prompt) > 1200 {
		return tiers.TierFrontier, "heuristic match on extensive prompt length (>1200 chars)"
	}
	if len(prompt) < 50 {
		return tiers.TierLightweight, "heuristic match on short prompt length (<50 chars)"
	}

	return tiers.TierWorkhorse, "standard task complexity heuristics"
}
