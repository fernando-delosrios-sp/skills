package router

import (
	"context"
	"fmt"
	"sort"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/benchmark"
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

func (r *Router) Resolve(ctx context.Context, prompt string, preferredTier string, preferredProvider string, preferredModel string) (*RouteDecision, error) {
	// When model is provided, tier is ignored
	if preferredModel != "" {
		targetModel := preferredModel
		targetProvider := preferredProvider
		targetTier := tiers.TierName("override")

		// If provider is not specified, attempt to deduce it from tiers matrix
		if targetProvider == "" {
			if foundProvider, foundTier := r.tiers.FindModelProvider(preferredModel); foundProvider != "" {
				targetProvider = foundProvider
				targetTier = foundTier
			}
		}

		// If still no provider, pick the provider with the best remaining quota
		if targetProvider == "" {
			quotas := r.quotaMgr.InspectAll(ctx, r.cfg, r.ledger)
			bestProvider := ""
			bestRemaining := -1.0
			for _, q := range quotas {
				if q.Status != "exhausted" && q.Remaining > bestRemaining {
					bestRemaining = q.Remaining
					bestProvider = q.Provider
				}
			}
			if bestProvider != "" {
				targetProvider = bestProvider
			} else if len(r.cfg.Providers) > 0 {
				targetProvider = r.cfg.Providers[0]
			}
		}

		alternatives := make([]string, 0)
		for _, p := range r.cfg.Providers {
			if p != targetProvider {
				alternatives = append(alternatives, p)
			}
		}

		return &RouteDecision{
			Tier:                 targetTier,
			Provider:             targetProvider,
			Model:                targetModel,
			Reason:               fmt.Sprintf("explicit model override: %s (tier ignored)", targetModel),
			AlternativeProviders: alternatives,
		}, nil
	}

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

	defaultEffort := "medium"
	switch targetTier {
	case tiers.TierFrontier:
		defaultEffort = "high"
	case tiers.TierLightweight:
		defaultEffort = "low"
	}

	// Step 3: Find candidate base models from quota-healthy providers
	type candidateBaseModel struct {
		provider  string
		baseModel string
		remaining float64
	}

	availableProviders := make([]string, 0)
	if preferredProvider != "" {
		q, exists := quotaMap[preferredProvider]
		if !exists || (q.Status != "exhausted" && q.Remaining > 0) {
			availableProviders = append(availableProviders, preferredProvider)
		}
	}

	if len(availableProviders) == 0 {
		sortedProviders := make([]string, len(r.cfg.Providers))
		copy(sortedProviders, r.cfg.Providers)
		sort.SliceStable(sortedProviders, func(i, j int) bool {
			remI := 100.0
			if q, ok := quotaMap[sortedProviders[i]]; ok {
				remI = q.Remaining
			}
			remJ := 100.0
			if q, ok := quotaMap[sortedProviders[j]]; ok {
				remJ = q.Remaining
			}
			return remI > remJ
		})

		for _, p := range sortedProviders {
			q, exists := quotaMap[p]
			if !exists || (q.Status != "exhausted" && q.Remaining > 0) {
				availableProviders = append(availableProviders, p)
			}
		}
	}

	allCandidateBaseModels := make([]candidateBaseModel, 0)
	seenBaseModels := make(map[string]bool)

	for _, p := range availableProviders {
		remaining := 100.0
		if q, exists := quotaMap[p]; exists {
			remaining = q.Remaining
		}
		models := r.tiers.GetModels(targetTier, p)
		if p == "opencode" {
			q, exists := quotaMap["opencode"]
			hasQuota := !exists || (q.Status != "exhausted" && q.Remaining > 0)
			models = benchmark.PrioritizeOpenCodeModels(models, hasQuota)
		}
		for _, m := range models {
			base, _ := benchmark.ExtractBaseModel(m)
			if !seenBaseModels[base] {
				seenBaseModels[base] = true
				allCandidateBaseModels = append(allCandidateBaseModels, candidateBaseModel{
					provider:  p,
					baseModel: base,
					remaining: remaining,
				})
			}
		}
	}

	if len(allCandidateBaseModels) == 0 {
		return nil, fmt.Errorf("all subscription providers in tier '%s' are exhausted", targetTier)
	}

	maxCandidates := r.cfg.Jev.CandidateModels
	if maxCandidates <= 0 {
		maxCandidates = 5
	}

	candidateCount := len(allCandidateBaseModels)
	if candidateCount > maxCandidates {
		candidateCount = maxCandidates
	}
	topCandidates := allCandidateBaseModels[:candidateCount]

	candidateNames := make([]string, len(topCandidates))
	candidateMap := make(map[string]candidateBaseModel)
	for i, c := range topCandidates {
		candidateNames[i] = c.baseModel
		candidateMap[c.baseModel] = c
	}

	// Ask Jev to select the optimal base model and effort (low, medium, high)
	selectedBaseModel, selectedEffort, err := r.classifier.SelectModel(ctx, prompt, candidateNames, defaultEffort)
	selected, ok := candidateMap[selectedBaseModel]
	if !ok || err != nil {
		selected = topCandidates[0]
	}

	// Combine base model and effort to find the right precise model
	providerModels := r.tiers.GetModels(targetTier, selected.provider)
	preciseModel := benchmark.FindPreciseModel(providerModels, selected.baseModel, selectedEffort)

	alternatives := make([]string, 0)
	for _, p := range r.cfg.Providers {
		if p != selected.provider {
			alternatives = append(alternatives, p)
		}
	}

	return &RouteDecision{
		Tier:                 targetTier,
		Provider:             selected.provider,
		Model:                preciseModel,
		Reason:               fmt.Sprintf("%s; selected %s (effort: %s) on %s (%.1f remaining allowance)", tierReason, preciseModel, selectedEffort, selected.provider, selected.remaining),
		AlternativeProviders: alternatives,
	}, nil
}
