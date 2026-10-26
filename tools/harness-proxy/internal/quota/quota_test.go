package quota

import (
	"context"
	"testing"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/ledger"
)

func TestParseCursorPlanSnapshot(t *testing.T) {
	mockSnapshot := []byte(`{
		"charts": [{
			"response": "{\"effectiveLimitCents\":50000,\"dailySpend\":[{\"spendCents\":60000}]}"
		}]
	}`)

	pq, err := parseCursorPlanSnapshot(mockSnapshot)
	if err != nil {
		t.Fatalf("failed to parse cursor snapshot: %v", err)
	}

	if pq.Status != "exhausted" {
		t.Fatalf("expected exhausted status when spend exceeds limit, got %s", pq.Status)
	}

	if pq.TotalAllowance != 500.0 {
		t.Fatalf("expected 500 limit, got %.2f", pq.TotalAllowance)
	}

	if pq.Used != 600.0 {
		t.Fatalf("expected 600 spent, got %.2f", pq.Used)
	}

	if pq.Remaining != 0 {
		t.Fatalf("expected 0 remaining, got %.2f", pq.Remaining)
	}
}

func TestParseCursorPlanSnapshotMultiCycle(t *testing.T) {
	mockSnapshot := []byte(`{
		"periodStartMs": 1790812800000,
		"periodEndMs": 1793491200000,
		"charts": [
			{
				"periodStartMs": 1790812800000,
				"periodEndMs": 1793491200000,
				"spendType": "all",
				"response": "{\"effectiveLimitCents\":50000,\"dailySpend\":[{\"spendCents\":70838}]}"
			},
			{
				"periodStartMs": 1788220800000,
				"periodEndMs": 1790812800000,
				"spendType": "all",
				"response": "{\"effectiveLimitCents\":50000,\"dailySpend\":[{\"spendCents\":120691}]}"
			}
		]
	}`)

	pq, err := parseCursorPlanSnapshot(mockSnapshot)
	if err != nil {
		t.Fatalf("failed to parse cursor snapshot: %v", err)
	}

	if pq.Used != 708.38 {
		t.Fatalf("expected 708.38 spent for current cycle, got %.2f", pq.Used)
	}
	if pq.TotalAllowance != 500.0 {
		t.Fatalf("expected 500.00 allowance, got %.2f", pq.TotalAllowance)
	}
	if pq.Status != "exhausted" {
		t.Fatalf("expected exhausted status, got %s", pq.Status)
	}
}

func TestQuotaManagerInspectAll(t *testing.T) {
	tempDir := t.TempDir()

	l, err := ledger.LoadLedger(tempDir)
	if err != nil {
		t.Fatalf("failed to load ledger: %v", err)
	}

	cfg := config.DefaultConfig()
	qm := NewQuotaManager(tempDir)

	quotas := qm.InspectAll(context.Background(), cfg, l)
	if len(quotas) != len(cfg.Providers) {
		t.Fatalf("expected %d quota results, got %d", len(cfg.Providers), len(quotas))
	}

	for _, q := range quotas {
		if q.Provider == "" {
			t.Fatal("expected provider name to be populated")
		}
		if q.Status == "" {
			t.Fatal("expected status to be populated")
		}
	}
}
