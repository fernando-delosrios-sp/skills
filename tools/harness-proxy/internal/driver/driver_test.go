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

func TestExtractResponse(t *testing.T) {
	// Empty
	if got := ExtractResponse(""); got != "" {
		t.Fatalf("expected empty string, got '%s'", got)
	}

	// Plain text
	raw := "Hello, I found 3 memory leaks."
	if got := ExtractResponse(raw); got != raw {
		t.Fatalf("expected '%s', got '%s'", raw, got)
	}

	// JSON with "response"
	jsonAgy := `{"status":"SUCCESS","response":"pong\n","duration_seconds":1.2}`
	if got := ExtractResponse(jsonAgy); got != "pong" {
		t.Fatalf("expected 'pong', got '%s'", got)
	}

	// JSON with "result"
	jsonResult := `{"result":"completed analysis"}`
	if got := ExtractResponse(jsonResult); got != "completed analysis" {
		t.Fatalf("expected 'completed analysis', got '%s'", got)
	}

	// NDJSON stream (Antigravity result event)
	ndjsonAgy := "{\"event\":\"init\",\"init\":{}}\n" +
		"{\"event\":\"step_update\",\"step_update\":{\"step_type\":\"tool\",\"tool_name\":\"run_command\"}}\n" +
		"{\"event\":\"result\",\"result\":{\"status\":\"SUCCESS\",\"response\":\"analysis complete\\n\"}}\n"
	if got := ExtractResponse(ndjsonAgy); got != "analysis complete" {
		t.Fatalf("expected 'analysis complete', got '%s'", got)
	}
}

func TestSummarizeToolCall(t *testing.T) {
	if got := summarizeToolCall("run_command", map[string]interface{}{"CommandLine": "git status"}); got != "run_command: git status" {
		t.Fatalf("unexpected summary: %s", got)
	}
	if got := summarizeToolCall("view_file", map[string]interface{}{"AbsolutePath": "src/main.ts"}); got != "view_file: src/main.ts" {
		t.Fatalf("unexpected summary: %s", got)
	}
	if got := summarizeToolCall("custom_action", nil); got != "custom_action" {
		t.Fatalf("unexpected summary: %s", got)
	}
}
