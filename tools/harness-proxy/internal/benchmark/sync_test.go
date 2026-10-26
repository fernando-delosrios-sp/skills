package benchmark

import (
	"testing"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

func TestBenchmarkScoreSorting(t *testing.T) {
	tempDir := t.TempDir()

	bd, err := SyncBenchmarks(tempDir, true)
	if err != nil {
		t.Fatalf("failed to sync benchmarks: %v", err)
	}

	// In Frontier tier sorted by score: Opus (97.5) should be first, Kimi (91.5) should be last
	frontierModels := []string{"kimi-k3.1-pro", "claude-opus-5-5", "claude-sonnet-5-5", "gemini-4-argon"}
	sortedFrontier := SortModelsByScore(frontierModels, bd)

	if sortedFrontier[0] != "claude-opus-5-5" {
		t.Fatalf("expected highest scoring frontier model to be claude-opus-5-5, got %s", sortedFrontier[0])
	}
	if sortedFrontier[len(sortedFrontier)-1] != "kimi-k3.1-pro" {
		t.Fatalf("expected lowest scoring frontier model to be kimi-k3.1-pro, got %s", sortedFrontier[len(sortedFrontier)-1])
	}
}

func TestBenchmarkSyncAndClassification(t *testing.T) {
	tempDir := t.TempDir()

	bd, err := SyncBenchmarks(tempDir, true)
	if err != nil {
		t.Fatalf("failed to sync benchmarks: %v", err)
	}

	if len(bd.Models) == 0 {
		t.Fatal("expected models in benchmark data")
	}

	if tier := ClassifyModel("claude-opus-5-5-high", bd); tier != tiers.TierFrontier {
		t.Fatalf("expected opus to be frontier, got %s", tier)
	}

	if tier := ClassifyModel("opencode-go/gpt-6-luna", bd); tier != tiers.TierFrontier {
		t.Fatalf("expected opencode-go/gpt-6-luna to be frontier, got %s", tier)
	}

	if tier := ClassifyModel("opencode-go/deepseek-v4-pro", bd); tier != tiers.TierWorkhorse {
		t.Fatalf("expected deepseek-v4-pro to be workhorse, got %s", tier)
	}

	if tier := ClassifyModel("opencode-go/deepseek-v4.1-flash", bd); tier != tiers.TierLightweight {
		t.Fatalf("expected deepseek-v4.1-flash to be lightweight, got %s", tier)
	}

	if tier := ClassifyModel("gemini-3.8-flash-low", bd); tier != tiers.TierLightweight {
		t.Fatalf("expected flash-low to be lightweight, got %s", tier)
	}
}

func TestPrioritizeOpenCodeModels(t *testing.T) {
	models := []string{
		"opencode/claude-opus-5-5",
		"opencode-go/gpt-6-luna",
		"opencode/gpt-6.1-sol",
		"opencode-go/deepseek-v4-pro",
	}

	// When quota is available, opencode-go models must come first
	prioritized := PrioritizeOpenCodeModels(models, true)
	if len(prioritized) != 4 {
		t.Fatalf("expected 4 models, got %d", len(prioritized))
	}
	if prioritized[0] != "opencode-go/gpt-6-luna" {
		t.Fatalf("expected first model to be opencode-go/gpt-6-luna, got %s", prioritized[0])
	}
	if prioritized[1] != "opencode-go/deepseek-v4-pro" {
		t.Fatalf("expected second model to be opencode-go/deepseek-v4-pro, got %s", prioritized[1])
	}
	if prioritized[2] != "opencode/claude-opus-5-5" {
		t.Fatalf("expected third model to be opencode/claude-opus-5-5, got %s", prioritized[2])
	}

	// When quota is exhausted (hasQuota = false), original order is preserved
	unprioritized := PrioritizeOpenCodeModels(models, false)
	if unprioritized[0] != "opencode/claude-opus-5-5" {
		t.Fatalf("expected first model to remain opencode/claude-opus-5-5 when quota exhausted, got %s", unprioritized[0])
	}
}

func TestExtractBaseModel(t *testing.T) {
	tests := []struct {
		input          string
		expectedBase   string
		expectedEffort string
	}{
		{"gemini-4-argon-medium", "gemini-4-argon", "medium"},
		{"gemini-4-argon-high", "gemini-4-argon", "high"},
		{"gemini-4-argon-low", "gemini-4-argon", "low"},
		{"claude-opus-5-5-high", "claude-opus-5-5", "high"},
		{"claude-opus-4-7-thinking-high-fast", "claude-opus-4-7", "high"},
		{"claude-4.5-opus-high-thinking", "claude-4.5-opus", "high"},
		{"claude-4.6-opus-max-thinking", "claude-4.6-opus", "high"},
		{"grok-4.7-low-fast", "grok-4.7", "low"},
		{"opencode-go/gpt-6-luna", "opencode-go/gpt-6-luna", ""},
		{"claude-haiku-5-5", "claude-haiku-5-5", ""},
	}

	for _, tc := range tests {
		base, effort := ExtractBaseModel(tc.input)
		if base != tc.expectedBase {
			t.Errorf("ExtractBaseModel(%q) base = %q, want %q", tc.input, base, tc.expectedBase)
		}
		if effort != tc.expectedEffort {
			t.Errorf("ExtractBaseModel(%q) effort = %q, want %q", tc.input, effort, tc.expectedEffort)
		}
	}
}

func TestFindPreciseModel(t *testing.T) {
	available := []string{
		"gemini-4-argon-low",
		"gemini-4-argon-medium",
		"gemini-4-argon-high",
		"claude-opus-4-7-thinking-low-fast",
		"claude-opus-4-7-thinking-medium",
		"claude-opus-4-7-thinking-high",
		"opencode-go/gpt-6-luna",
	}

	// High effort on gemini
	if res := FindPreciseModel(available, "gemini-4-argon", "high"); res != "gemini-4-argon-high" {
		t.Fatalf("expected gemini-4-argon-high, got %s", res)
	}

	// Low effort on gemini
	if res := FindPreciseModel(available, "gemini-4-argon", "low"); res != "gemini-4-argon-low" {
		t.Fatalf("expected gemini-4-argon-low, got %s", res)
	}

	// Medium effort on claude
	if res := FindPreciseModel(available, "claude-opus-4-7", "medium"); res != "claude-opus-4-7-thinking-medium" {
		t.Fatalf("expected claude-opus-4-7-thinking-medium, got %s", res)
	}

	// No effort variant on opencode-go
	if res := FindPreciseModel(available, "opencode-go/gpt-6-luna", "high"); res != "opencode-go/gpt-6-luna" {
		t.Fatalf("expected opencode-go/gpt-6-luna, got %s", res)
	}
}

