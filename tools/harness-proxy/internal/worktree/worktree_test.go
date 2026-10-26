package worktree

import (
	"os"
	"path/filepath"
	"testing"
)

func setupTestGitRepo(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()

	_, err := runGit(dir, "init")
	if err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	_, _ = runGit(dir, "config", "user.email", "test@example.com")
	_, _ = runGit(dir, "config", "user.name", "Test User")

	readme := filepath.Join(dir, "README.md")
	if err := os.WriteFile(readme, []byte("# Initial Commit\n"), 0644); err != nil {
		t.Fatalf("failed to write readme: %v", err)
	}

	_, _ = runGit(dir, "add", "README.md")
	_, _ = runGit(dir, "commit", "-m", "initial commit")
	return dir
}

func TestWorktreeLifecycle(t *testing.T) {
	repoDir := setupTestGitRepo(t)
	origDir, _ := os.Getwd()
	defer os.Chdir(origDir)
	_ = os.Chdir(repoDir)

	mgr := NewManager("")
	session, err := mgr.Create("test-task-1")
	if err != nil {
		t.Fatalf("failed to create worktree: %v", err)
	}
	defer session.Cleanup()

	// Verify worktree exists
	if _, err := os.Stat(session.WorktreeDir); err != nil {
		t.Fatalf("worktree dir does not exist: %v", err)
	}

	// Make an edit inside worktree
	newFile := filepath.Join(session.WorktreeDir, "new_feature.txt")
	if err := os.WriteFile(newFile, []byte("feature complete\n"), 0644); err != nil {
		t.Fatalf("failed to write new file in worktree: %v", err)
	}

	// Commit inside worktree
	sha, err := session.Commit("feat: add new feature")
	if err != nil {
		t.Fatalf("failed to commit: %v", err)
	}
	if sha == "" {
		t.Fatal("expected non-empty commit SHA")
	}

	// Merge into active
	result, err := session.MergeIntoActive(true)
	if err != nil {
		t.Fatalf("unexpected error merging: %v", err)
	}
	if !result.Merged {
		t.Fatalf("expected clean merge, got conflict: %v", result.ConflictingFiles)
	}

	// Verify merged file exists in main repo
	mergedFile := filepath.Join(repoDir, "new_feature.txt")
	if _, err := os.Stat(mergedFile); err != nil {
		t.Fatalf("merged file missing from main repo: %v", err)
	}
}
