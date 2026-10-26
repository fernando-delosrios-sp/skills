package driver

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync/atomic"
	"time"
)

// ComposePrompt combines system instructions with the task prompt
func ComposePrompt(taskPrompt, systemPrompt string) string {
	sys := strings.TrimSpace(systemPrompt)
	task := strings.TrimSpace(taskPrompt)
	if sys == "" {
		return task
	}
	if task == "" {
		return sys
	}
	return fmt.Sprintf("=== SYSTEM INSTRUCTIONS ===\n%s\n\n=== TASK ===\n%s", sys, task)
}

// ExtractResponse extracts the human-readable response from tool JSON formats (agy, agent, etc.) or raw text.
func ExtractResponse(stdout string) string {
	trimmed := strings.TrimSpace(stdout)
	if trimmed == "" {
		return ""
	}

	// 1. Try single JSON unmarshal
	var obj map[string]interface{}
	if err := json.Unmarshal([]byte(trimmed), &obj); err == nil {
		if text := extractFromObject(obj); text != "" {
			return text
		}
	}

	// 2. Scan lines backwards for NDJSON result
	lines := strings.Split(trimmed, "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}
		var lineObj map[string]interface{}
		if err := json.Unmarshal([]byte(line), &lineObj); err == nil {
			if text := extractFromObject(lineObj); text != "" {
				return text
			}
		}
	}

	return trimmed
}

func extractFromObject(obj map[string]interface{}) string {
	if res, ok := obj["result"].(map[string]interface{}); ok {
		if resp, ok := res["response"].(string); ok && strings.TrimSpace(resp) != "" {
			return strings.TrimSpace(resp)
		}
	}
	if resp, ok := obj["response"].(string); ok && strings.TrimSpace(resp) != "" {
		return strings.TrimSpace(resp)
	}
	if result, ok := obj["result"].(string); ok && strings.TrimSpace(result) != "" {
		return strings.TrimSpace(result)
	}
	if content, ok := obj["content"].(string); ok && strings.TrimSpace(content) != "" {
		return strings.TrimSpace(content)
	}
	return ""
}

func summarizeToolCall(toolName string, params map[string]interface{}) string {
	if toolName == "" {
		toolName = "action"
	}
	if params == nil || len(params) == 0 {
		return toolName
	}
	keys := []string{
		"CommandLine", "command", "cmd",
		"AbsolutePath", "path", "filePath",
		"TargetFile", "targetFile", "file",
		"Query", "query", "pattern",
		"DirectoryPath", "dir", "directory",
		"url", "Url",
		"Prompt", "prompt",
	}
	for _, key := range keys {
		if val, ok := params[key]; ok {
			if str, ok := val.(string); ok && strings.TrimSpace(str) != "" {
				str = strings.TrimSpace(str)
				if len(str) > 75 {
					str = str[:72] + "..."
				}
				return fmt.Sprintf("%s: %s", toolName, str)
			}
		}
	}
	return toolName
}

type ExecutionResult struct {
	ExitCode int           `json:"exit_code"`
	Stdout   string        `json:"stdout"`
	Stderr   string        `json:"stderr"`
	Duration time.Duration `json:"duration"`
}

type Driver interface {
	Name() string
	Execute(ctx context.Context, worktreeDir string, model string, prompt string) (*ExecutionResult, error)
}

func GetDriver(provider string) (Driver, error) {
	switch provider {
	case "cursor":
		return &CursorDriver{}, nil
	case "antigravity":
		return &AntigravityDriver{}, nil
	case "opencode":
		return &OpenCodeDriver{}, nil
	default:
		return nil, fmt.Errorf("unsupported provider driver: %s", provider)
	}
}

// CursorDriver invokes the Cursor Agent CLI headlessly
type CursorDriver struct{}

func (d *CursorDriver) Name() string { return "cursor" }

func (d *CursorDriver) Execute(ctx context.Context, worktreeDir string, model string, prompt string) (*ExecutionResult, error) {
	args := []string{
		"-p", prompt,
		"-f",
		"--output-format", "stream-json",
		"--stream-partial-output",
		"--workspace", worktreeDir,
	}
	if model != "" {
		args = append(args, "--model", model)
	}

	cmdPath, err := exec.LookPath("agent")
	if err != nil {
		cmdPath = "agent" // Rely on PATH or mock
	}

	return runCommand(ctx, worktreeDir, cmdPath, args...)
}

// AntigravityDriver invokes the agy CLI headlessly
type AntigravityDriver struct{}

func (d *AntigravityDriver) Name() string { return "antigravity" }

func (d *AntigravityDriver) Execute(ctx context.Context, worktreeDir string, model string, prompt string) (*ExecutionResult, error) {
	args := []string{
		"-p", prompt,
		"--dangerously-skip-permissions",
		"--output-format", "stream-json",
		"--new-project",
	}
	if model != "" {
		args = append(args, "--model", model)
	}

	cmdPath, err := exec.LookPath("agy")
	if err != nil {
		cmdPath = "agy"
	}

	return runCommand(ctx, worktreeDir, cmdPath, args...)
}

// OpenCodeDriver invokes OpenCode CLI headlessly
type OpenCodeDriver struct{}

func (d *OpenCodeDriver) Name() string { return "opencode" }

func (d *OpenCodeDriver) Execute(ctx context.Context, worktreeDir string, model string, prompt string) (*ExecutionResult, error) {
	args := []string{
		"run", prompt,
		"--auto",
		"--format", "json",
	}
	if model != "" {
		args = append(args, "-m", model)
	}

	cmdPath, err := exec.LookPath("opencode")
	if err != nil {
		cmdPath = "opencode"
	}

	return runCommand(ctx, worktreeDir, cmdPath, args...)
}

func runCommand(ctx context.Context, dir string, name string, args ...string) (*ExecutionResult, error) {
	start := time.Now()
	cmd := exec.CommandContext(ctx, name, args...)
	if dir != "" {
		cmd.Dir = dir
	}

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to open stdout pipe: %w", err)
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to open stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start %s: %w", name, err)
	}

	var rawStdout bytes.Buffer
	var rawStderr bytes.Buffer
	var capturedResponse string
	var textDeltas strings.Builder

	var lastActivityMillis atomic.Int64
	lastActivityMillis.Store(time.Now().UnixMilli())

	// Heartbeat ticker to avoid abnormally quiet periods
	doneTicker := make(chan struct{})
	go func() {
		ticker := time.NewTicker(4 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-doneTicker:
				return
			case now := <-ticker.C:
				last := time.UnixMilli(lastActivityMillis.Load())
				if now.Sub(last) >= 4*time.Second {
					elapsed := now.Sub(start).Round(time.Second)
					fmt.Fprintf(os.Stderr, "   ⏳ Processing... (%s elapsed)\n", elapsed)
				}
			}
		}
	}()

	// Stderr reader in background
	go func() {
		r := bufio.NewReader(stderrPipe)
		for {
			line, err := r.ReadString('\n')
			if len(line) > 0 {
				rawStderr.WriteString(line)
			}
			if err != nil {
				break
			}
		}
	}()

	// Stdout line reader (streams events in real time)
	stdoutReader := bufio.NewReader(stdoutPipe)
	for {
		line, err := stdoutReader.ReadString('\n')
		if len(line) > 0 {
			rawStdout.WriteString(line)
			lastActivityMillis.Store(time.Now().UnixMilli())
			handleStreamLine(line, &capturedResponse, &textDeltas)
		}
		if err != nil {
			break
		}
	}

	waitErr := cmd.Wait()
	close(doneTicker)
	duration := time.Since(start)

	exitCode := 0
	if waitErr != nil {
		if exitErr, ok := waitErr.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, fmt.Errorf("failed waiting for %s: %w", name, waitErr)
		}
	}

	fmt.Fprintf(os.Stderr, "   ✓ Completed in %s\n", duration.Round(100*time.Millisecond))

	finalStdout := rawStdout.String()
	if strings.TrimSpace(capturedResponse) != "" {
		finalStdout = strings.TrimSpace(capturedResponse)
	} else if strings.TrimSpace(textDeltas.String()) != "" {
		finalStdout = strings.TrimSpace(textDeltas.String())
	}

	return &ExecutionResult{
		ExitCode: exitCode,
		Stdout:   finalStdout,
		Stderr:   rawStderr.String(),
		Duration: duration,
	}, nil
}

func handleStreamLine(line string, capturedResponse *string, textDeltas *strings.Builder) {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return
	}

	var event map[string]interface{}
	if err := json.Unmarshal([]byte(trimmed), &event); err != nil {
		return
	}

	// 1. Antigravity events
	if eventType, ok := event["event"].(string); ok {
		switch eventType {
		case "init":
			fmt.Fprintf(os.Stderr, "   ⚙️  Harness session initialized\n")
		case "step_update":
			if su, ok := event["step_update"].(map[string]interface{}); ok {
				stepType, _ := su["step_type"].(string)
				state, _ := su["state"].(string)
				if stepType == "tool" && state == "ACTIVE" {
					toolName, _ := su["tool_name"].(string)
					var params map[string]interface{}
					if ti, ok := su["tool_info"].(map[string]interface{}); ok {
						if p, ok := ti["parameters"].(map[string]interface{}); ok {
							params = p
						}
					}
					summary := summarizeToolCall(toolName, params)
					fmt.Fprintf(os.Stderr, "   ↳ [tool] %s\n", summary)
				}
				if delta, ok := su["text_delta"].(string); ok && delta != "" {
					textDeltas.WriteString(delta)
				}
			}
		case "result":
			if res, ok := event["result"].(map[string]interface{}); ok {
				if resp, ok := res["response"].(string); ok {
					*capturedResponse = resp
				}
			}
		}
		return
	}

	// 2. Cursor events
	if cType, ok := event["type"].(string); ok {
		switch cType {
		case "tool_call", "tool", "call":
			toolName, _ := event["name"].(string)
			if toolName == "" {
				toolName, _ = event["tool_name"].(string)
			}
			var params map[string]interface{}
			if p, ok := event["parameters"].(map[string]interface{}); ok {
				params = p
			} else if a, ok := event["arguments"].(map[string]interface{}); ok {
				params = a
			}
			summary := summarizeToolCall(toolName, params)
			fmt.Fprintf(os.Stderr, "   ↳ [tool] %s\n", summary)
		case "result":
			if res, ok := event["result"].(string); ok {
				*capturedResponse = res
			}
		}
	}
}
