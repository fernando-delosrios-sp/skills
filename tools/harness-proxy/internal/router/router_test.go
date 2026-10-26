package router

import (
	"context"
	"testing"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/jev"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/ledger"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/quota"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

func TestRouterResolveWithPreferredTier(t *testing.T) {
	tempDir := t.TempDir()

	cfg := config.DefaultConfig()
	j := jev.NewClassifier(cfg)
	tm := tiers.DefaultTiers()
	qm := quota.NewQuotaManager(tempDir)
	_ = qm.SaveCache([]quota.ProviderQuota{
		{Provider: "cursor", Status: "healthy", Remaining: 50.0, TotalAllowance: 100.0},
		{Provider: "antigravity", Status: "healthy", Remaining: 80.0, TotalAllowance: 100.0},
		{Provider: "opencode", Status: "healthy", Remaining: 90.0, TotalAllowance: 100.0},
	})
	l, _ := ledger.LoadLedger(tempDir)

	r := NewRouter(cfg, j, tm, qm, l)

	decision, err := r.Resolve(context.Background(), "any prompt", "frontier", "cursor")
	if err != nil {
		t.Fatalf("unexpected error resolving route: %v", err)
	}

	if decision.Tier != tiers.TierFrontier {
		t.Fatalf("expected tier frontier, got %s", decision.Tier)
	}

	if decision.Provider != "cursor" {
		t.Fatalf("expected preferred provider cursor, got %s", decision.Provider)
	}

	if decision.Model != "gemini-4-argon" {
		t.Fatalf("expected primary cheapest model gemini-4-argon, got %s", decision.Model)
	}

	if len(decision.AlternativeProviders) == 0 {
		t.Fatal("expected alternative providers for failover")
	}
}

func TestRouterFallbackWhenPreferredExhausted(t *testing.T) {
	tempDir := t.TempDir()

	cfg := config.DefaultConfig()
	j := jev.NewClassifier(cfg)
	tm := tiers.DefaultTiers()
	qm := quota.NewQuotaManager(tempDir)
	// Cursor is exhausted, antigravity has remaining quota
	_ = qm.SaveCache([]quota.ProviderQuota{
		{Provider: "cursor", Status: "exhausted", Remaining: 0.0, TotalAllowance: 500.0, Used: 600.0},
		{Provider: "antigravity", Status: "healthy", Remaining: 80.0, TotalAllowance: 100.0},
		{Provider: "opencode", Status: "healthy", Remaining: 10.0, TotalAllowance: 100.0},
	})
	l, _ := ledger.LoadLedger(tempDir)

	r := NewRouter(cfg, j, tm, qm, l)

	decision, err := r.Resolve(context.Background(), "any prompt", "frontier", "cursor")
	if err != nil {
		t.Fatalf("unexpected error resolving route: %v", err)
	}

	if decision.Provider == "cursor" {
		t.Fatalf("expected router to avoid exhausted cursor, got %s", decision.Provider)
	}

	if decision.Provider != "antigravity" {
		t.Fatalf("expected router to pick antigravity (highest remaining), got %s", decision.Provider)
	}
}

func TestRouterResolveWithClassifier(t *testing.T) {
	tempDir := t.TempDir()

	cfg := config.DefaultConfig()
	j := jev.NewClassifier(cfg)
	tm := tiers.DefaultTiers()
	qm := quota.NewQuotaManager(tempDir)
	l, _ := ledger.LoadLedger(tempDir)

	r := NewRouter(cfg, j, tm, qm, l)

	// Lightweight task
	decision, err := r.Resolve(context.Background(), "Fix typo in comment", "", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if decision.Tier != tiers.TierLightweight {
		t.Fatalf("expected lightweight tier, got %s", decision.Tier)
	}

	if decision.Provider == "" {
		t.Fatal("expected a provider to be selected")
	}
}
