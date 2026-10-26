package worktree

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type WorktreeSession struct {
	TaskID       string
	Branch       string
	ActiveBranch string
	RepoRoot     string
	WorktreeDir  string
}

type MergeResult struct {
	Merged           bool     `json:"merged"`
	Conflict         bool     `json:"conflict"`
	CommitHash       string   `json:"commit_hash,omitempty"`
	Branch           string   `json:"branch"`
	DiffSummary      string   `json:"diff_summary,omitempty"`
	ConflictingFiles []string `json:"conflicting_files,omitempty"`
}

type Manager struct {
	baseDir string
}

func NewManager(baseDir string) *Manager {
	return &Manager{baseDir: baseDir}
}

func (m *Manager) Create(taskID string) (*WorktreeSession, error) {
	repoRoot, err := runGit("", "rev-parse", "--show-toplevel")
	if err != nil {
		return nil, fmt.Errorf("failed to locate git repo root: %w", err)
	}
	repoRoot = strings.TrimSpace(repoRoot)

	activeBranch, err := runGit(repoRoot, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return nil, fmt.Errorf("failed to get active git branch: %w", err)
	}
	activeBranch = strings.TrimSpace(activeBranch)

	branchName := fmt.Sprintf("harness/%s", taskID)

	// Create new branch from HEAD
	if _, err := runGit(repoRoot, "branch", branchName, "HEAD"); err != nil {
		return nil, fmt.Errorf("failed to create branch %s: %w", branchName, err)
	}

	// Determine worktree directory location
	var wtDir string
	if m.baseDir != "" {
		wtDir = filepath.Join(m.baseDir, taskID)
	} else {
		wtDir = filepath.Join(repoRoot, ".git", "harness-worktrees", taskID)
	}

	if err := os.MkdirAll(filepath.Dir(wtDir), 0755); err != nil {
		return nil, fmt.Errorf("failed to create worktree parent dir: %w", err)
	}

	// Mount worktree
	if _, err := runGit(repoRoot, "worktree", "add", wtDir, branchName); err != nil {
		_, _ = runGit(repoRoot, "branch", "-D", branchName)
		return nil, fmt.Errorf("failed to add git worktree: %w", err)
	}

	return &WorktreeSession{
		TaskID:       taskID,
		Branch:       branchName,
		ActiveBranch: activeBranch,
		RepoRoot:     repoRoot,
		WorktreeDir:  wtDir,
	}, nil
}

func (ws *WorktreeSession) Commit(message string) (string, error) {
	// Stage all changes
	if _, err := runGit(ws.WorktreeDir, "add", "-A"); err != nil {
		return "", fmt.Errorf("failed to stage worktree changes: %w", err)
	}

	// Check if there are changes to commit
	status, err := runGit(ws.WorktreeDir, "status", "--porcelain")
	if err != nil {
		return "", fmt.Errorf("failed to check worktree status: %w", err)
	}
	if strings.TrimSpace(status) == "" {
		// Nothing changed
		return "", nil
	}

	if _, err := runGit(ws.WorktreeDir, "commit", "-m", message); err != nil {
		return "", fmt.Errorf("failed to commit worktree changes: %w", err)
	}

	sha, err := runGit(ws.WorktreeDir, "rev-parse", "HEAD")
	if err != nil {
		return "", fmt.Errorf("failed to read commit SHA: %w", err)
	}
	return strings.TrimSpace(sha), nil
}

func (ws *WorktreeSession) MergeIntoActive(autoMerge bool) (*MergeResult, error) {
	res := &MergeResult{
		Branch: ws.Branch,
	}

	// Diff summary between active branch and task branch
	diff, _ := runGit(ws.RepoRoot, "diff", "--stat", ws.ActiveBranch, ws.Branch)
	res.DiffSummary = strings.TrimSpace(diff)

	if !autoMerge {
		return res, nil
	}

	// Attempt merge into active branch
	mergeOut, err := runGit(ws.RepoRoot, "merge", "--no-ff", ws.Branch, "-m", fmt.Sprintf("harness-proxy: merge %s", ws.TaskID))
	if err != nil {
		// Conflict occurred -> abort merge cleanly
		_, _ = runGit(ws.RepoRoot, "merge", "--abort")

		conflicts, _ := runGit(ws.RepoRoot, "diff", "--name-only", ws.ActiveBranch, ws.Branch)
		res.Conflict = true
		res.Merged = false
		for _, f := range strings.Split(strings.TrimSpace(conflicts), "\n") {
			if strings.TrimSpace(f) != "" {
				res.ConflictingFiles = append(res.ConflictingFiles, strings.TrimSpace(f))
			}
		}
		return res, nil
	}

	res.Merged = true
	sha, _ := runGit(ws.RepoRoot, "rev-parse", "HEAD")
	res.CommitHash = strings.TrimSpace(sha)
	_ = mergeOut
	return res, nil
}

func (ws *WorktreeSession) Cleanup() error {
	_, err := runGit(ws.RepoRoot, "worktree", "remove", "--force", ws.WorktreeDir)
	return err
}

func runGit(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	if dir != "" {
		cmd.Dir = dir
	}
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return stdout.String(), fmt.Errorf("git %s failed: %w (stderr: %s)", strings.Join(args, " "), err, stderr.String())
	}
	return stdout.String(), nil
}
