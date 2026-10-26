package jev

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

func TestClassifyWithHeuristics(t *testing.T) {
	tier, reason := ClassifyWithHeuristics("Fix typo in readme file")
	if tier != tiers.TierLightweight {
		t.Fatalf("expected lightweight, got %s (reason: %s)", tier, reason)
	}

	tier, reason = ClassifyWithHeuristics("Resolve memory leak and deadlock in concurrency worker pool")
	if tier != tiers.TierFrontier {
		t.Fatalf("expected frontier, got %s (reason: %s)", tier, reason)
	}

	tier, reason = ClassifyWithHeuristics("Implement new user profile edit endpoint with tests")
	if tier != tiers.TierWorkhorse {
		t.Fatalf("expected workhorse, got %s (reason: %s)", tier, reason)
	}
}

func TestClassifyWithMockEndpoint(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"choices": [{"message": {"role": "assistant", "content": "frontier"}}]}`))
	}))
	defer server.Close()

	cfg := config.DefaultConfig()
	cfg.Jev.Endpoint = server.URL

	classifier := NewClassifier(cfg)
	tier, reason, err := classifier.Classify(context.Background(), "any prompt")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if tier != tiers.TierFrontier {
		t.Fatalf("expected frontier, got %s (%s)", tier, reason)
	}
}
