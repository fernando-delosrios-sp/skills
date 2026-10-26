package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.Jev.Endpoint == "" {
		t.Fatal("expected non-empty Jev endpoint in default config")
	}
	if len(cfg.Providers) != 3 {
		t.Fatalf("expected 3 default providers, got %d", len(cfg.Providers))
	}
	if !cfg.Worktree.AutoMerge {
		t.Fatal("expected AutoMerge to be true by default")
	}
}

func TestLoadConfigWithOverride(t *testing.T) {
	tempDir := t.TempDir()
	origXDG := os.Getenv("XDG_CONFIG_HOME")
	defer os.Setenv("XDG_CONFIG_HOME", origXDG)
	os.Setenv("XDG_CONFIG_HOME", tempDir)

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("unexpected error loading config: %v", err)
	}

	expectedDir := filepath.Join(tempDir, "harness-proxy")
	if cfg.GlobalDir != expectedDir {
		t.Fatalf("expected GlobalDir %s, got %s", expectedDir, cfg.GlobalDir)
	}

	// Verify global config.yaml was written
	if _, err := os.Stat(filepath.Join(expectedDir, "config.yaml")); err != nil {
		t.Fatalf("expected config.yaml to exist: %v", err)
	}
}

func TestSaveConfig(t *testing.T) {
	tempDir := t.TempDir()
	cfg := DefaultConfig()
	cfg.GlobalDir = filepath.Join(tempDir, "harness-proxy")
	cfg.Jev.Endpoint = "http://custom-endpoint:11434/v1"
	cfg.Jev.Model = "custom-model"
	cfg.Jev.APIKey = "secret-123"

	savedPath, err := cfg.Save(false)
	if err != nil {
		t.Fatalf("failed to save config: %v", err)
	}

	if _, err := os.Stat(savedPath); err != nil {
		t.Fatalf("saved file does not exist: %v", err)
	}

	// Verify reload
	origXDG := os.Getenv("XDG_CONFIG_HOME")
	defer os.Setenv("XDG_CONFIG_HOME", origXDG)
	os.Setenv("XDG_CONFIG_HOME", tempDir)

	reloaded, err := LoadConfig()
	if err != nil {
		t.Fatalf("failed to reload config: %v", err)
	}
	if reloaded.Jev.Endpoint != "http://custom-endpoint:11434/v1" {
		t.Fatalf("expected endpoint http://custom-endpoint:11434/v1, got %s", reloaded.Jev.Endpoint)
	}
	if reloaded.Jev.Model != "custom-model" {
		t.Fatalf("expected model custom-model, got %s", reloaded.Jev.Model)
	}
	if reloaded.Jev.APIKey != "secret-123" {
		t.Fatalf("expected apiKey secret-123, got %s", reloaded.Jev.APIKey)
	}
}
