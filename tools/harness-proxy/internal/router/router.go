package router

import (
	"context"
	"fmt"
	"sort"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/jev"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/ledger"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/quota"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

type RouteDecision struct {
	Tier                 tiers.TierName `json:"tier"`
	Provider             string         `json:"provider"`
	Model                string         `json:"model"`
	Reason               string         `json:"reason"`
	AlternativeProviders []string       `json:"alternative_providers"`
}

type Router struct {
	cfg        *config.Config
	classifier *jev.Classifier
	tiers      *tiers.TiersMatrix
	quotaMgr   *quota.QuotaManager
	ledger     *ledger.Ledger
}

func NewRouter(cfg *config.Config, j *jev.Classifier, tm *tiers.TiersMatrix, qm *quota.QuotaManager, l *ledger.Ledger) *Router {
	return &Router{
		cfg:        cfg,
		classifier: j,
		tiers:      tm,
		quotaMgr:   qm,
		ledger:     l,
	}
}

func (r *Router) Resolve(ctx context.Context, prompt string, preferredTier string, preferredProvider string) (*RouteDecision, error) {
	// Step 1: Resolve Tier
	var targetTier tiers.TierName
	tierReason := ""

	switch preferredTier {
	case string(tiers.TierFrontier):
		targetTier = tiers.TierFrontier
		tierReason = "explicit tier override: frontier"
	case string(tiers.TierWorkhorse):
		targetTier = tiers.TierWorkhorse
		tierReason = "explicit tier override: workhorse"
	case string(tiers.TierLightweight):
		targetTier = tiers.TierLightweight
		tierReason = "explicit tier override: lightweight"
	default:
		classified, reason, err := r.classifier.Classify(ctx, prompt)
		if err != nil {
			targetTier = tiers.TierWorkhorse
			tierReason = "classifier error, defaulted to workhorse: " + err.Error()
		} else {
			targetTier = classified
			tierReason = reason
		}
	}

	// Step 2: Fetch current quotas
	quotas := r.quotaMgr.InspectAll(ctx, r.cfg, r.ledger)
	quotaMap := make(map[string]quota.ProviderQuota)
	for _, q := range quotas {
		quotaMap[q.Provider] = q
	}

	// Step 3: Find candidate providers that have configured models in this tier
	type candidate struct {
		provider  string
		model     string
		remaining float64
	}

	candidates := make([]candidate, 0)
	for _, p := range r.cfg.Providers {
		models := r.tiers.GetModels(targetTier, p)
		if len(models) == 0 {
			continue
		}
		q, exists := quotaMap[p]
		if !exists || q.Remaining > 0 {
			remaining := 100.0
			if exists {
				remaining = q.Remaining
			}
			candidates = append(candidates, candidate{
				provider:  p,
				model:     models[0], // primary model in tier
				remaining: remaining,
			})
		}
	}

	if len(candidates) == 0 {
		return nil, fmt.Errorf("all subscription providers in tier '%s' are exhausted", targetTier)
	}

	// If preferred provider requested and available, use it first
	selectedIdx := -1
	if preferredProvider != "" {
		for i, c := range candidates {
			if c.provider == preferredProvider {
				selectedIdx = i
				break
			}
		}
	}

	// Otherwise, sort candidates by remaining quota descending (arbitrage)
	if selectedIdx == -1 {
		sort.SliceStable(candidates, func(i, j int) bool {
			return candidates[i].remaining > candidates[j].remaining
		})
		selectedIdx = 0
	}

	selected := candidates[selectedIdx]
	alternatives := make([]string, 0, len(candidates)-1)
	for i, c := range candidates {
		if i != selectedIdx {
			alternatives = append(alternatives, c.provider)
		}
	}

	return &RouteDecision{
		Tier:                 targetTier,
		Provider:             selected.provider,
		Model:                selected.model,
		Reason:               fmt.Sprintf("%s; selected %s with %.1f remaining allowance", tierReason, selected.provider, selected.remaining),
		AlternativeProviders: alternatives,
	}, nil
}
