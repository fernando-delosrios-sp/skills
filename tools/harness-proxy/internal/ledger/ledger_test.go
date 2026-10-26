package ledger

import (
	"path/filepath"
	"testing"
	"time"
)

func TestLedgerRecordAndQuery(t *testing.T) {
	tempDir := t.TempDir()

	l, err := LoadLedger(tempDir)
	if err != nil {
		t.Fatalf("failed to load ledger: %v", err)
	}

	now := time.Now().UTC()
	err = l.Record(Entry{
		ID:               "task-1",
		Provider:         "cursor",
		Model:            "claude-3-5-sonnet",
		Tier:             "workhorse",
		PromptTokens:     100,
		CompletionTokens: 50,
		DurationSeconds:  1.5,
		Status:           "success",
	})
	if err != nil {
		t.Fatalf("failed to record entry: %v", err)
	}

	// Failed task shouldn't count toward usage
	err = l.Record(Entry{
		ID:               "task-2",
		Provider:         "cursor",
		Model:            "claude-3-5-sonnet",
		Tier:             "workhorse",
		PromptTokens:     50,
		CompletionTokens: 0,
		DurationSeconds:  0.5,
		Status:           "failed",
	})
	if err != nil {
		t.Fatalf("failed to record entry: %v", err)
	}

	calls, tokens := l.GetProviderUsage("cursor", now.Add(-1*time.Minute))
	if calls != 1 {
		t.Fatalf("expected 1 successful call, got %d", calls)
	}
	if tokens != 150 {
		t.Fatalf("expected 150 tokens, got %d", tokens)
	}

	// Reload and verify persistence
	reloaded, err := LoadLedger(tempDir)
	if err != nil {
		t.Fatalf("failed to reload ledger: %v", err)
	}
	if len(reloaded.Entries) != 2 {
		t.Fatalf("expected 2 entries in reloaded ledger, got %d", len(reloaded.Entries))
	}

	// Check file path
	if reloaded.filePath != filepath.Join(tempDir, "ledger.json") {
		t.Fatalf("unexpected ledger file path: %s", reloaded.filePath)
	}
}
