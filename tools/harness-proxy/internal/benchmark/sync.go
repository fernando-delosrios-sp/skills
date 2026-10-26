package benchmark

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
)

type ModelScore struct {
	ModelName      string  `json:"model_name"`
	CodingScore    float64 `json:"coding_score"`      // 0 - 100
	QualityIndex   float64 `json:"quality_index"`     // Percentile or quality index
	BlendedCostUSD float64 `json:"blended_cost_usd"`  // Blended cost per 1M tokens in USD (or relative cost index)
}

type BenchmarkData struct {
	Timestamp time.Time             `json:"timestamp"`
	Models    map[string]ModelScore `json:"models"` // normalized model name -> score
}

func DefaultBenchmarks() *BenchmarkData {
	return &BenchmarkData{
		Timestamp: time.Now().UTC(),
		Models: map[string]ModelScore{
			// Frontier Tier (Quality >= 90) - sorted by cost: Kimi/Qwen/GLM ($0.80-$1.50) -> Argon ($2.00) -> Sonnet ($3.00) -> GPT-6 ($5.00) -> Opus ($15.00)
			"kimi-k3.1-pro":           {ModelName: "Kimi K3.1 Pro", CodingScore: 91.5, QualityIndex: 93.0, BlendedCostUSD: 0.80},
			"kimi-k3":                 {ModelName: "Kimi K3", CodingScore: 91.0, QualityIndex: 92.0, BlendedCostUSD: 0.80},
			"qwen3.8-max":             {ModelName: "Qwen 3.8 Max", CodingScore: 90.5, QualityIndex: 91.0, BlendedCostUSD: 1.20},
			"glm-5.3":                 {ModelName: "GLM 5.3", CodingScore: 90.0, QualityIndex: 90.5, BlendedCostUSD: 1.50},
			"mimo-v2.5-pro":           {ModelName: "MiMo v2.5 Pro", CodingScore: 90.0, QualityIndex: 90.5, BlendedCostUSD: 1.60},
			"gemini-4-argon":          {ModelName: "Gemini 4 Argon", CodingScore: 93.0, QualityIndex: 94.0, BlendedCostUSD: 2.00},
			"claude-sonnet-5-5":       {ModelName: "Claude Sonnet 5.5", CodingScore: 94.0, QualityIndex: 95.0, BlendedCostUSD: 3.00},
			"gpt-6-luna":              {ModelName: "GPT-6 Luna", CodingScore: 96.0, QualityIndex: 97.0, BlendedCostUSD: 5.00},
			"gpt-6-astra":             {ModelName: "GPT-6 Astra", CodingScore: 95.5, QualityIndex: 96.5, BlendedCostUSD: 5.50},
			"gpt-6.1-sol":             {ModelName: "GPT-6.1 Sol", CodingScore: 97.0, QualityIndex: 97.5, BlendedCostUSD: 6.00},
			"claude-opus-5-5":         {ModelName: "Claude Opus 5.5", CodingScore: 97.5, QualityIndex: 98.0, BlendedCostUSD: 15.00},

			// Workhorse Tier (75 <= Quality < 90) - sorted by cost: DeepSeek ($0.25) -> Qwen/MiMo ($0.40) -> Flash ($0.75) -> Argon-Med ($1.00) -> Haiku ($1.25) -> Grok/GPT ($2.50)
			"deepseek-v4-pro":         {ModelName: "DeepSeek v4 Pro", CodingScore: 88.0, QualityIndex: 89.0, BlendedCostUSD: 0.25},
			"qwen3.7-plus":            {ModelName: "Qwen 3.7 Plus", CodingScore: 77.0, QualityIndex: 77.0, BlendedCostUSD: 0.40},
			"glm-5.3-flash":           {ModelName: "GLM 5.3 Flash", CodingScore: 76.0, QualityIndex: 76.0, BlendedCostUSD: 0.45},
			"minimax-m3":              {ModelName: "MiniMax M3", CodingScore: 81.0, QualityIndex: 82.0, BlendedCostUSD: 0.50},
			"mimo-v2.6-pro":           {ModelName: "MiMo v2.6 Pro", CodingScore: 80.0, QualityIndex: 80.0, BlendedCostUSD: 0.60},
			"gemini-3.8-flash-high":   {ModelName: "Gemini 3.8 Flash High", CodingScore: 84.0, QualityIndex: 85.0, BlendedCostUSD: 0.70},
			"gemini-3.8-flash-medium": {ModelName: "Gemini 3.8 Flash Medium", CodingScore: 78.0, QualityIndex: 78.0, BlendedCostUSD: 0.70},
			"gemini-4-argon-medium":   {ModelName: "Gemini 4 Argon Medium", CodingScore: 87.5, QualityIndex: 88.0, BlendedCostUSD: 1.00},
			"claude-haiku-5-5":        {ModelName: "Claude Haiku 5.5", CodingScore: 82.0, QualityIndex: 83.0, BlendedCostUSD: 1.25},
			"grok-4.7":                {ModelName: "Grok 4.7", CodingScore: 85.0, QualityIndex: 85.0, BlendedCostUSD: 2.00},
			"gpt-5.6-luna":            {ModelName: "GPT-5.6 Luna", CodingScore: 87.0, QualityIndex: 87.0, BlendedCostUSD: 2.50},
			"gpt-5.6-sol":             {ModelName: "GPT-5.6 Sol", CodingScore: 86.5, QualityIndex: 86.5, BlendedCostUSD: 2.50},

			// Lightweight Tier (Quality < 75) - sorted by cost: Free ($0.00) -> DeepSeek Flash ($0.10) -> Gemini Flash Low ($0.15) -> Qwen Flash ($0.20) -> OSS/Cursor Small ($0.40)
			"beam-free":               {ModelName: "Beam Free", CodingScore: 60.0, QualityIndex: 60.0, BlendedCostUSD: 0.00},
			"flint-40b-free":          {ModelName: "Flint 40B Free", CodingScore: 58.0, QualityIndex: 58.0, BlendedCostUSD: 0.00},
			"deepseek-v4.1-flash":     {ModelName: "DeepSeek v4.1 Flash", CodingScore: 74.0, QualityIndex: 74.0, BlendedCostUSD: 0.10},
			"gemini-3.8-flash-low":    {ModelName: "Gemini 3.8 Flash Low", CodingScore: 72.0, QualityIndex: 72.0, BlendedCostUSD: 0.15},
			"qwen3.8-flash":           {ModelName: "Qwen 3.8 Flash", CodingScore: 70.0, QualityIndex: 70.0, BlendedCostUSD: 0.20},
			"gpt-oss-120b":            {ModelName: "GPT-OSS 120B", CodingScore: 68.0, QualityIndex: 68.0, BlendedCostUSD: 0.30},
			"cursor-small":            {ModelName: "Cursor Small", CodingScore: 65.0, QualityIndex: 65.0, BlendedCostUSD: 0.40},
		},
	}
}

func SyncBenchmarks(cacheDir string, force bool) (*BenchmarkData, error) {
	cachePath := filepath.Join(cacheDir, "benchmarks.json")

	if !force {
		if data, err := os.ReadFile(cachePath); err == nil {
			var bd BenchmarkData
			if jsonErr := json.Unmarshal(data, &bd); jsonErr == nil {
				if time.Since(bd.Timestamp) < 7*24*time.Hour {
					return &bd, nil
				}
			}
		}
	}

	bd := DefaultBenchmarks()
	bd.Timestamp = time.Now().UTC()

	if out, err := json.MarshalIndent(bd, "", "  "); err == nil {
		_ = os.WriteFile(cachePath, out, 0644)
	}

	return bd, nil
}

func ClassifyModel(model string, bd *BenchmarkData) tiers.TierName {
	normalized := strings.ToLower(model)

	cleanName := normalized
	if idx := strings.Index(cleanName, "/"); idx != -1 {
		cleanName = cleanName[idx+1:]
	}

	bestKey := ""
	for key := range bd.Models {
		if strings.Contains(cleanName, key) || strings.Contains(normalized, key) {
			if len(key) > len(bestKey) {
				bestKey = key
			}
		}
	}

	if bestKey != "" {
		score := bd.Models[bestKey]
		if score.QualityIndex >= 90.0 {
			return tiers.TierFrontier
		} else if score.QualityIndex >= 75.0 {
			return tiers.TierWorkhorse
		}
		return tiers.TierLightweight
	}

	if strings.Contains(cleanName, "opus") || strings.Contains(cleanName, "argon-high") ||
		strings.Contains(cleanName, "gpt-6") || strings.Contains(cleanName, "max") ||
		strings.Contains(cleanName, "pro") {
		return tiers.TierFrontier
	}
	if strings.Contains(cleanName, "flash") || strings.Contains(cleanName, "nano") ||
		strings.Contains(cleanName, "free") || strings.Contains(cleanName, "small") ||
		strings.Contains(cleanName, "low") {
		return tiers.TierLightweight
	}
	return tiers.TierWorkhorse
}

func GetModelCost(model string, bd *BenchmarkData) float64 {
	normalized := strings.ToLower(model)

	// Free models always score 0.0
	if strings.Contains(normalized, "free") || strings.Contains(normalized, "contributor") {
		return 0.0
	}

	cleanName := normalized
	if idx := strings.Index(cleanName, "/"); idx != -1 {
		cleanName = cleanName[idx+1:]
	}

	bestKey := ""
	for key := range bd.Models {
		if strings.Contains(cleanName, key) || strings.Contains(normalized, key) {
			if len(key) > len(bestKey) {
				bestKey = key
			}
		}
	}

	if bestKey != "" {
		return bd.Models[bestKey].BlendedCostUSD
	}

	// Heuristics based on effort and size modifiers
	baseCost := 2.0
	if strings.Contains(cleanName, "opus") {
		baseCost = 15.0
	} else if strings.Contains(cleanName, "gpt-6") {
		baseCost = 5.0
	} else if strings.Contains(cleanName, "sonnet") {
		baseCost = 3.0
	} else if strings.Contains(cleanName, "flash") || strings.Contains(cleanName, "mini") {
		baseCost = 0.5
	} else if strings.Contains(cleanName, "nano") || strings.Contains(cleanName, "small") {
		baseCost = 0.3
	}

	// Effort multipliers
	if strings.Contains(cleanName, "low") {
		baseCost *= 0.6
	} else if strings.Contains(cleanName, "high") || strings.Contains(cleanName, "thinking") {
		baseCost *= 1.5
	} else if strings.Contains(cleanName, "xhigh") || strings.Contains(cleanName, "max") {
		baseCost *= 2.0
	}

	return baseCost
}

func SortModelsByCost(models []string, bd *BenchmarkData) []string {
	sorted := make([]string, len(models))
	copy(sorted, models)

	sort.SliceStable(sorted, func(i, j int) bool {
		costI := GetModelCost(sorted[i], bd)
		costJ := GetModelCost(sorted[j], bd)
		if costI != costJ {
			return costI < costJ // Lowest cost first!
		}
		return sorted[i] < sorted[j]
	})

	return sorted
}

func DiscoverProviderModels(provider string) ([]string, error) {
	switch provider {
	case "antigravity":
		return discoverAgyModels()
	case "opencode":
		return discoverOpenCodeModels()
	case "cursor":
		return discoverCursorModels()
	default:
		return nil, nil
	}
}

func discoverAgyModels() ([]string, error) {
	cmdPath, err := exec.LookPath("agy")
	if err != nil {
		return nil, err
	}
	cmd := exec.Command(cmdPath, "models")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Run(); err != nil {
		return nil, err
	}

	lines := strings.Split(stdout.String(), "\n")
	models := make([]string, 0)
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "⠋") || strings.HasPrefix(line, "Loading") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) > 0 {
			models = append(models, fields[0])
		}
	}
	return models, nil
}

func discoverOpenCodeModels() ([]string, error) {
	cmdPath, err := exec.LookPath("opencode")
	if err != nil {
		return nil, err
	}
	cmd := exec.Command(cmdPath, "models")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Run(); err != nil {
		return nil, err
	}

	lines := strings.Split(stdout.String(), "\n")
	goModels := make([]string, 0)
	stdModels := make([]string, 0)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "opencode-go/") {
			goModels = append(goModels, line)
		} else if strings.HasPrefix(line, "opencode/") {
			stdModels = append(stdModels, line)
		}
	}

	if len(goModels) > 0 {
		return append(goModels, stdModels...), nil
	}
	return stdModels, nil
}

func discoverCursorModels() ([]string, error) {
	cmdPath, err := exec.LookPath("agent")
	if err == nil {
		cmd := exec.Command(cmdPath, "models")
		var stdout bytes.Buffer
		cmd.Stdout = &stdout
		if err := cmd.Run(); err == nil {
			lines := strings.Split(stdout.String(), "\n")
			models := make([]string, 0)
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line != "" && !strings.Contains(line, "Loading") && !strings.Contains(line, "No models") && !strings.HasPrefix(line, "Available") && !strings.HasPrefix(line, "Tip:") {
					fields := strings.Fields(line)
					if len(fields) > 0 {
						models = append(models, fields[0])
					}
				}
			}
			if len(models) > 0 {
				return models, nil
			}
		}
	}

	return []string{
		"claude-opus-5-5",
		"claude-sonnet-5-5",
		"gpt-6-luna",
		"claude-haiku-5-5",
		"gemini-4-argon",
		"gpt-5.6-luna",
		"cursor-small",
		"gpt-5.4-mini",
	}, nil
}
