package benchmark

import (
	"testing"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

func TestBenchmarkCostSorting(t *testing.T) {
	tempDir := t.TempDir()

	bd, err := SyncBenchmarks(tempDir, true)
	if err != nil {
		t.Fatalf("failed to sync benchmarks: %v", err)
	}

	// In Frontier tier: Kimi ($0.80) should be sorted before Sonnet ($3.00) and Opus ($15.00)
	frontierModels := []string{"claude-opus-5-5", "claude-sonnet-5-5", "kimi-k3.1-pro", "gemini-4-argon"}
	sortedFrontier := SortModelsByCost(frontierModels, bd)

	if sortedFrontier[0] != "kimi-k3.1-pro" {
		t.Fatalf("expected cheapest frontier model to be kimi-k3.1-pro, got %s", sortedFrontier[0])
	}
	if sortedFrontier[len(sortedFrontier)-1] != "claude-opus-5-5" {
		t.Fatalf("expected most expensive frontier model to be claude-opus-5-5, got %s", sortedFrontier[len(sortedFrontier)-1])
	}

	// In Workhorse tier: DeepSeek ($0.25) should be sorted before Haiku ($1.25) and GPT-5.6 ($2.50)
	workhorseModels := []string{"gpt-5.6-luna", "deepseek-v4-pro", "claude-haiku-5-5"}
	sortedWorkhorse := SortModelsByCost(workhorseModels, bd)

	if sortedWorkhorse[0] != "deepseek-v4-pro" {
		t.Fatalf("expected cheapest workhorse model to be deepseek-v4-pro, got %s", sortedWorkhorse[0])
	}

	// In Lightweight tier: Free models should always be first
	lightweightModels := []string{"cursor-small", "beam-free", "deepseek-v4.1-flash"}
	sortedLightweight := SortModelsByCost(lightweightModels, bd)

	if sortedLightweight[0] != "beam-free" {
		t.Fatalf("expected free model to be first, got %s", sortedLightweight[0])
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
