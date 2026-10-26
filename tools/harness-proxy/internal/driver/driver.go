package driver

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"time"
)

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
		"--output-format", "json",
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
		"--output-format", "json",
		"--add-dir", worktreeDir,
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

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	duration := time.Since(start)

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, fmt.Errorf("failed to execute %s: %w", name, err)
		}
	}

	return &ExecutionResult{
		ExitCode: exitCode,
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		Duration: duration,
	}, nil
}
