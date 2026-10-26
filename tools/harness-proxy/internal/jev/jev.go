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
