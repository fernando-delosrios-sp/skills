package driver

import (
	"testing"
)

func TestGetDriver(t *testing.T) {
	for _, p := range []string{"cursor", "antigravity", "opencode"} {
		d, err := GetDriver(p)
		if err != nil {
			t.Fatalf("expected driver for %s, got error: %v", p, err)
		}
		if d.Name() != p {
			t.Fatalf("expected name %s, got %s", p, d.Name())
		}
	}

	_, err := GetDriver("unknown")
	if err == nil {
		t.Fatal("expected error for unknown driver")
	}
}

func TestComposePrompt(t *testing.T) {
	if got := ComposePrompt("my task", ""); got != "my task" {
		t.Fatalf("expected 'my task', got '%s'", got)
	}
	if got := ComposePrompt("", "system instructions"); got != "system instructions" {
		t.Fatalf("expected 'system instructions', got '%s'", got)
	}
	expected := "=== SYSTEM INSTRUCTIONS ===\nact as reviewer\n\n=== TASK ===\nreview code"
	if got := ComposePrompt("review code", "act as reviewer"); got != expected {
		t.Fatalf("expected '%s', got '%s'", expected, got)
	}
}
