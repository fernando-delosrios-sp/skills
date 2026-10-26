package quota

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/ledger"
)

type ProviderQuota struct {
	Provider       string    `json:"provider"`
	Metric         string    `json:"metric"` // "$ USD", "% allowance", "reqs"
	TotalAllowance float64   `json:"total_allowance"`
	Remaining      float64   `json:"remaining"`
	Used           float64   `json:"used"`
	PercentUsed    float64   `json:"percent_used"`
	ResetTime      time.Time `json:"reset_time"`
	IsEstimate     bool      `json:"is_estimate"`
	Status         string    `json:"status"` // "healthy", "exhausted", "error", "estimated"
	Details        string    `json:"details,omitempty"`
	Error          string    `json:"error,omitempty"`
}

type QuotaSnapshot struct {
	Timestamp time.Time       `json:"timestamp"`
	Quotas    []ProviderQuota `json:"quotas"`
}

type QuotaManager struct {
	cachePath string
}

func NewQuotaManager(cacheDir string) *QuotaManager {
	return &QuotaManager{
		cachePath: filepath.Join(cacheDir, "quota.json"),
	}
}

func (qm *QuotaManager) InspectAll(ctx context.Context, cfg *config.Config, l *ledger.Ledger) []ProviderQuota {
	// Check cached quota first (valid for 1 minute for near real-time accuracy)
	if snap, err := qm.loadCache(); err == nil && time.Since(snap.Timestamp) < 1*time.Minute {
		return snap.Quotas
	}

	results := make([]ProviderQuota, len(cfg.Providers))
	var wg sync.WaitGroup

	for i, provider := range cfg.Providers {
		wg.Add(1)
		go func(idx int, p string) {
			defer wg.Done()
			results[idx] = qm.inspectProvider(ctx, p, l)
		}(i, provider)
	}

	wg.Wait()
	_ = qm.SaveCache(results)
	return results
}

func (qm *QuotaManager) inspectProvider(ctx context.Context, provider string, l *ledger.Ledger) ProviderQuota {
	switch provider {
	case "cursor":
		return qm.inspectCursor(l)
	case "opencode":
		return qm.inspectOpenCode(l)
	case "antigravity":
		return qm.inspectAntigravity(l)
	default:
		return qm.fallbackInspect(provider, l)
	}
}

// 1. Cursor inspection: reads live enterprise/pro plan usage snapshot from Cursor's state.vscdb
func (qm *QuotaManager) inspectCursor(l *ledger.Ledger) ProviderQuota {
	home, err := os.UserHomeDir()
	if err == nil {
		vscdbPath := filepath.Join(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb")
		if _, statErr := os.Stat(vscdbPath); statErr == nil {
			query := "SELECT value FROM ItemTable WHERE key = 'aiSettings.enterprisePlanUsageSnapshot';"
			cmd := exec.Command("/usr/bin/sqlite3", vscdbPath, query)
			var stdout bytes.Buffer
			cmd.Stdout = &stdout
			if cmd.Run() == nil && stdout.Len() > 0 {
				pq, parseErr := parseCursorPlanSnapshot(stdout.Bytes())
				if parseErr == nil {
					return *pq
				}
			}
		}
	}
	return qm.fallbackInspect("cursor", l)
}

type cursorSnapshot struct {
	PeriodStartMs int64 `json:"periodStartMs"`
	PeriodEndMs   int64 `json:"periodEndMs"`
	Charts        []struct {
		PeriodStartMs int64  `json:"periodStartMs"`
		PeriodEndMs   int64  `json:"periodEndMs"`
		SpendType     string `json:"spendType"`
		Response      string `json:"response"`
	} `json:"charts"`
}

type cursorChartResponse struct {
	EffectiveLimitCents float64 `json:"effectiveLimitCents"`
	DailySpend          []struct {
		SpendCents float64 `json:"spendCents"`
	} `json:"dailySpend"`
}

func parseCursorPlanSnapshot(data []byte) (*ProviderQuota, error) {
	var snap cursorSnapshot
	if err := json.Unmarshal(data, &snap); err != nil {
		return nil, err
	}

	if len(snap.Charts) == 0 {
		return nil, fmt.Errorf("no charts found in cursor snapshot")
	}

	// Pick the chart corresponding to the current billing period
	targetIdx := -1
	for i, c := range snap.Charts {
		if snap.PeriodStartMs > 0 && c.PeriodStartMs == snap.PeriodStartMs {
			if c.SpendType == "all" || c.SpendType == "" {
				targetIdx = i
				break
			}
			if targetIdx == -1 {
				targetIdx = i
			}
		}
	}

	// Fallback to the chart with the most recent PeriodStartMs
	if targetIdx == -1 {
		var maxStart int64 = -1
		for i, c := range snap.Charts {
			if c.PeriodStartMs > maxStart {
				maxStart = c.PeriodStartMs
				targetIdx = i
			}
		}
	}

	if targetIdx == -1 {
		targetIdx = 0
	}

	targetChart := snap.Charts[targetIdx]

	var limitCents float64 = 50000 // $500 default
	var totalSpendCents float64 = 0

	var cr cursorChartResponse
	if err := json.Unmarshal([]byte(targetChart.Response), &cr); err == nil {
		if cr.EffectiveLimitCents > 0 {
			limitCents = cr.EffectiveLimitCents
		}
		for _, d := range cr.DailySpend {
			totalSpendCents += d.SpendCents
		}
	}

	limitUSD := limitCents / 100.0
	spentUSD := totalSpendCents / 100.0
	remainingUSD := limitUSD - spentUSD
	if remainingUSD < 0 {
		remainingUSD = 0
	}
	pctUsed := (spentUSD / limitUSD) * 100.0

	status := "healthy"
	if spentUSD >= limitUSD {
		status = "exhausted"
	}

	now := time.Now().UTC()
	resetTime := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)
	if snap.PeriodEndMs > 0 {
		resetTime = time.UnixMilli(snap.PeriodEndMs).UTC()
	} else if targetChart.PeriodEndMs > 0 {
		resetTime = time.UnixMilli(targetChart.PeriodEndMs).UTC()
	}

	return &ProviderQuota{
		Provider:       "cursor",
		Metric:         "$ USD",
		TotalAllowance: limitUSD,
		Used:           spentUSD,
		Remaining:      remainingUSD,
		PercentUsed:    pctUsed,
		ResetTime:      resetTime,
		IsEstimate:     false,
		Status:         status,
		Details:        fmt.Sprintf("Spend: $%.2f / $%.2f", spentUSD, limitUSD),
	}, nil
}

// 2. OpenCode Go inspection: aggregates cost from local opencode.db (session_message table)
func (qm *QuotaManager) inspectOpenCode(l *ledger.Ledger) ProviderQuota {
	home, err := os.UserHomeDir()
	if err == nil {
		dbPath := filepath.Join(home, ".local", "share", "opencode", "opencode.db")
		if _, statErr := os.Stat(dbPath); statErr == nil {
			now := time.Now().UTC()
			oct1Ms := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).UnixMilli()

			query := fmt.Sprintf(
				"SELECT count(*), COALESCE(SUM(CAST(json_extract(data,'$.cost') AS REAL)), 0) "+
					"FROM session_message "+
					"WHERE json_valid(data) "+
					"AND (json_extract(data,'$.model.providerID') = 'opencode-go' OR json_extract(data,'$.providerID') = 'opencode-go') "+
					"AND time_created >= %d;", oct1Ms,
			)

			cmd := exec.Command("/usr/bin/sqlite3", dbPath, query)
			var stdout bytes.Buffer
			cmd.Stdout = &stdout
			if cmd.Run() == nil {
				parts := strings.Split(strings.TrimSpace(stdout.String()), "|")
				if len(parts) == 2 {
					calls, _ := strconv.Atoi(parts[0])
					spentUSD, _ := strconv.ParseFloat(parts[1], 64)

					limitUSD := 10.0 // Standard monthly Go subscription allowance
					remainingUSD := limitUSD - spentUSD
					if remainingUSD < 0 {
						remainingUSD = 0
					}
					pctUsed := (spentUSD / limitUSD) * 100.0

					status := "healthy"
					if spentUSD >= limitUSD {
						status = "exhausted"
					}

					resetTime := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)

					return ProviderQuota{
						Provider:       "opencode",
						Metric:         "$ USD",
						TotalAllowance: limitUSD,
						Used:           spentUSD,
						Remaining:      remainingUSD,
						PercentUsed:    pctUsed,
						ResetTime:      resetTime,
						IsEstimate:     false,
						Status:         status,
						Details:        fmt.Sprintf("Go: $%.2f / $%.2f (%d calls)", spentUSD, limitUSD, calls),
					}
				}
			}
		}
	}
	return qm.fallbackInspect("opencode", l)
}

// 3. Antigravity inspection: reads live quota status from ~/.tokentracker/tracker/usage-limits-cache.json
func (qm *QuotaManager) inspectAntigravity(l *ledger.Ledger) ProviderQuota {
	home, err := os.UserHomeDir()
	if err == nil {
		trackerPath := filepath.Join(home, ".tokentracker", "tracker", "usage-limits-cache.json")
		if data, err := os.ReadFile(trackerPath); err == nil {
			var parsed struct {
				Antigravity struct {
					AccountPlan   string `json:"account_plan"`
					PrimaryWindow struct {
						UsedPercent float64 `json:"used_percent"`
						ResetAt     string  `json:"reset_at"`
					} `json:"primary_window"`
					QuaternaryWindow struct {
						UsedPercent float64 `json:"used_percent"`
						ResetAt     string  `json:"reset_at"`
					} `json:"quaternary_window"`
				} `json:"antigravity"`
			}
			if jsonErr := json.Unmarshal(data, &parsed); jsonErr == nil {
				ag := parsed.Antigravity
				usedPct := ag.QuaternaryWindow.UsedPercent // Gemini 5-hour rolling window
				remainingPct := 100.0 - usedPct
				if remainingPct < 0 {
					remainingPct = 0
				}

				resetTime := time.Now().Add(4 * time.Hour)
				if parsedReset, parseErr := time.Parse(time.RFC3339, ag.QuaternaryWindow.ResetAt); parseErr == nil {
					resetTime = parsedReset
				}

				status := "healthy"
				if remainingPct <= 0 {
					status = "exhausted"
				}

				plan := ag.AccountPlan
				if plan == "" {
					plan = "Google AI Pro"
				}

				return ProviderQuota{
					Provider:       "antigravity",
					Metric:         "% window",
					TotalAllowance: 100.0,
					Used:           usedPct,
					Remaining:      remainingPct,
					PercentUsed:    usedPct,
					ResetTime:      resetTime,
					IsEstimate:     false,
					Status:         status,
					Details:        fmt.Sprintf("%s (Gemini: %.0f%%, Claude: %.0f%%)", plan, usedPct, ag.PrimaryWindow.UsedPercent),
				}
			}
		}
	}
	return qm.fallbackInspect("antigravity", l)
}

func (qm *QuotaManager) fallbackInspect(provider string, l *ledger.Ledger) ProviderQuota {
	now := time.Now().UTC()
	resetTime := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)
	defaultAllowance := 500.0
	usedCalls, _ := l.GetProviderUsage(provider, l.CycleStartDate)
	remaining := defaultAllowance - float64(usedCalls)
	if remaining < 0 {
		remaining = 0
	}

	return ProviderQuota{
		Provider:       provider,
		Metric:         "reqs",
		TotalAllowance: defaultAllowance,
		Used:           float64(usedCalls),
		Remaining:      remaining,
		PercentUsed:    (float64(usedCalls) / defaultAllowance) * 100.0,
		ResetTime:      resetTime,
		IsEstimate:     true,
		Status:         "healthy",
		Details:        "Local ledger fallback",
	}
}

func (qm *QuotaManager) loadCache() (*QuotaSnapshot, error) {
	data, err := os.ReadFile(qm.cachePath)
	if err != nil {
		return nil, err
	}
	var snap QuotaSnapshot
	if err := json.Unmarshal(data, &snap); err != nil {
		return nil, err
	}
	return &snap, nil
}

func (qm *QuotaManager) SaveCache(quotas []ProviderQuota) error {
	snap := QuotaSnapshot{
		Timestamp: time.Now().UTC(),
		Quotas:    quotas,
	}
	data, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(qm.cachePath, data, 0644)
}
