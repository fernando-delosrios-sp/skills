package tiers

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type TierName string

const (
	TierFrontier    TierName = "frontier"
	TierWorkhorse   TierName = "workhorse"
	TierLightweight TierName = "lightweight"
)

type ProviderModels map[string][]string // provider -> []modelName

type TiersMatrix struct {
	Frontier    ProviderModels `yaml:"frontier"`
	Workhorse   ProviderModels `yaml:"workhorse"`
	Lightweight ProviderModels `yaml:"lightweight"`
}

func DefaultTiers() *TiersMatrix {
	return &TiersMatrix{
		Frontier: ProviderModels{
			"antigravity": {
				"gemini-4-argon-low",
				"gemini-4-argon-high",
				"claude-sonnet-5-5-high",
				"claude-opus-5-5-high",
			},
			"cursor": {
				"gemini-4-argon",
				"claude-sonnet-5-5",
				"gpt-6-luna",
				"claude-opus-5-5",
			},
			"opencode": {
				"opencode-go/kimi-k3.1-pro",
				"opencode-go/qwen3.8-max",
				"opencode-go/gemini-4-argon",
				"opencode-go/gpt-6-luna",
				"opencode-go/claude-opus-5-5",
			},
		},
		Workhorse: ProviderModels{
			"antigravity": {
				"gemini-3.8-flash-high",
				"gemini-3.8-flash-medium",
				"gemini-4-argon-medium",
				"claude-sonnet-5-5-medium",
			},
			"cursor": {
				"claude-haiku-5-5",
				"gemini-4-argon",
				"gpt-5.6-luna",
			},
			"opencode": {
				"opencode-go/deepseek-v4-pro",
				"opencode-go/qwen3.7-plus",
				"opencode-go/claude-haiku-5-5",
				"opencode-go/gpt-5.6-luna",
				"opencode-go/grok-4.7",
			},
		},
		Lightweight: ProviderModels{
			"antigravity": {
				"gemini-3.8-flash-low",
				"gemini-3.8-flash-medium",
				"gpt-oss-120b-medium",
			},
			"cursor": {
				"cursor-small",
				"gpt-5.4-mini",
			},
			"opencode": {
				"opencode-go/beam-free",
				"opencode-go/deepseek-v4.1-flash",
				"opencode-go/qwen3.8-flash",
			},
		},
	}
}

func LoadTiers(configDir string) (*TiersMatrix, error) {
	tiersPath := filepath.Join(configDir, "tiers.yaml")
	data, err := os.ReadFile(tiersPath)
	if err != nil {
		if os.IsNotExist(err) {
			defaults := DefaultTiers()
			if saveErr := SaveTiers(configDir, defaults); saveErr != nil {
				return nil, saveErr
			}
			return defaults, nil
		}
		return nil, fmt.Errorf("failed to read %s: %w", tiersPath, err)
	}

	var tm TiersMatrix
	if err := yaml.Unmarshal(data, &tm); err != nil {
		return nil, fmt.Errorf("failed to parse %s: %w", tiersPath, err)
	}
	return &tm, nil
}

func SaveTiers(configDir string, tm *TiersMatrix) error {
	tiersPath := filepath.Join(configDir, "tiers.yaml")
	data, err := yaml.Marshal(tm)
	if err != nil {
		return fmt.Errorf("failed to marshal tiers: %w", err)
	}
	return os.WriteFile(tiersPath, data, 0644)
}

func (tm *TiersMatrix) GetModels(tier TierName, provider string) []string {
	var pm ProviderModels
	switch tier {
	case TierFrontier:
		pm = tm.Frontier
	case TierWorkhorse:
		pm = tm.Workhorse
	case TierLightweight:
		pm = tm.Lightweight
	default:
		return nil
	}
	return pm[provider]
}

func (tm *TiersMatrix) FindModelProvider(model string) (string, TierName) {
	for p, models := range tm.Frontier {
		for _, m := range models {
			if m == model {
				return p, TierFrontier
			}
		}
	}
	for p, models := range tm.Workhorse {
		for _, m := range models {
			if m == model {
				return p, TierWorkhorse
			}
		}
	}
	for p, models := range tm.Lightweight {
		for _, m := range models {
			if m == model {
				return p, TierLightweight
			}
		}
	}
	return "", ""
}
