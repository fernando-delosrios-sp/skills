package ledger

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Entry struct {
	ID               string    `json:"id"`
	Timestamp        time.Time `json:"timestamp"`
	Provider         string    `json:"provider"`
	Model            string    `json:"model"`
	Tier             string    `json:"tier"`
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int       `json:"completion_tokens"`
	DurationSeconds  float64   `json:"duration_seconds"`
	Status           string    `json:"status"` // "success", "failed", "conflict", "failover"
	Error            string    `json:"error,omitempty"`
}

type Ledger struct {
	mu             sync.RWMutex
	filePath       string
	CycleStartDate time.Time `json:"cycle_start_date"`
	Entries        []Entry   `json:"entries"`
}

func LoadLedger(configDir string) (*Ledger, error) {
	path := filepath.Join(configDir, "ledger.json")
	l := &Ledger{
		filePath:       path,
		CycleStartDate: time.Now().UTC().AddDate(0, 0, -time.Now().Day()+1), // Start of current month
		Entries:        make([]Entry, 0),
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return l, nil
		}
		return nil, fmt.Errorf("failed to read ledger: %w", err)
	}

	if err := json.Unmarshal(data, l); err != nil {
		return nil, fmt.Errorf("failed to parse ledger JSON: %w", err)
	}
	l.filePath = path
	return l, nil
}

func (l *Ledger) Record(entry Entry) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now().UTC()
	}

	l.Entries = append(l.Entries, entry)
	return l.save()
}

func (l *Ledger) save() error {
	data, err := json.MarshalIndent(l, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal ledger: %w", err)
	}
	return os.WriteFile(l.filePath, data, 0644)
}

func (l *Ledger) GetProviderUsage(provider string, since time.Time) (callCount int, estTokens int) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	for _, e := range l.Entries {
		if e.Provider == provider && e.Timestamp.After(since) && e.Status == "success" {
			callCount++
			estTokens += e.PromptTokens + e.CompletionTokens
		}
	}
	return callCount, estTokens
}
