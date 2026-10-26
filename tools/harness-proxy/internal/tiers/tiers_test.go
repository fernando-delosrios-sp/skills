package tiers

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultTiers(t *testing.T) {
	tm := DefaultTiers()
	models := tm.GetModels(TierFrontier, "antigravity")
	if len(models) == 0 {
		t.Fatal("expected models for antigravity in frontier tier")
	}

	workhorseCursor := tm.GetModels(TierWorkhorse, "cursor")
	if len(workhorseCursor) == 0 {
		t.Fatal("expected models for cursor in workhorse tier")
	}
}

func TestLoadAndSaveTiers(t *testing.T) {
	tempDir := t.TempDir()

	// Should create default when not found
	tm, err := LoadTiers(tempDir)
	if err != nil {
		t.Fatalf("failed to load tiers: %v", err)
	}

	if len(tm.Frontier["cursor"]) == 0 {
		t.Fatal("expected default tiers loaded")
	}

	// Modify and save
	tm.Lightweight["test-provider"] = []string{"custom-model"}
	if err := SaveTiers(tempDir, tm); err != nil {
		t.Fatalf("failed to save tiers: %v", err)
	}

	// Reload and verify
	reloaded, err := LoadTiers(tempDir)
	if err != nil {
		t.Fatalf("failed to reload tiers: %v", err)
	}

	if len(reloaded.Lightweight["test-provider"]) != 1 || reloaded.Lightweight["test-provider"][0] != "custom-model" {
		t.Fatal("custom tier model was not preserved")
	}

	// Check file actually exists
	tiersPath := filepath.Join(tempDir, "tiers.yaml")
	if _, err := os.Stat(tiersPath); err != nil {
		t.Fatalf("expected tiers.yaml at %s: %v", tiersPath, err)
	}
}
