package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type JevConfig struct {
	Endpoint        string `yaml:"endpoint"`
	Model           string `yaml:"model"`
	APIKey          string `yaml:"api_key"`
	CandidateModels int    `yaml:"candidate_models"`
}

type WorktreeConfig struct {
	BaseDir   string `yaml:"base_dir"`
	AutoMerge bool   `yaml:"auto_merge"`
}

type Config struct {
	Jev       JevConfig      `yaml:"jev"`
	Providers []string       `yaml:"providers"`
	Worktree  WorktreeConfig `yaml:"worktree"`

	GlobalDir string `yaml:"-"`
	CacheDir  string `yaml:"-"`
}

func DefaultConfig() *Config {
	return &Config{
		Jev: JevConfig{
			Endpoint:        "http://localhost:11434/v1",
			Model:           "qwen2.5-coder:7b",
			APIKey:          "",
			CandidateModels: 5,
		},
		Providers: []string{"antigravity", "cursor", "opencode"},
		Worktree: WorktreeConfig{
			BaseDir:   "",
			AutoMerge: true,
		},
	}
}

func GetConfigDir() (string, error) {
	if xdg := os.Getenv("XDG_CONFIG_HOME"); xdg != "" {
		return filepath.Join(xdg, "harness-proxy"), nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "harness-proxy"), nil
}

func GetCacheDir() (string, error) {
	configDir, err := GetConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "cache"), nil
}

func LoadConfig() (*Config, error) {
	cfg := DefaultConfig()

	dir, err := GetConfigDir()
	if err != nil {
		return nil, err
	}
	cfg.GlobalDir = dir

	cacheDir, err := GetCacheDir()
	if err != nil {
		return nil, err
	}
	cfg.CacheDir = cacheDir

	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return nil, err
	}

	globalPath := filepath.Join(dir, "config.yaml")
	if data, err := os.ReadFile(globalPath); err == nil {
		_ = yaml.Unmarshal(data, cfg)
	} else if os.IsNotExist(err) {
		// Save default configuration
		if out, err := yaml.Marshal(cfg); err == nil {
			_ = os.WriteFile(globalPath, out, 0644)
		}
	}

	// Look for repository-level overrides in current working directory
	repoConfigPath := ".harness-proxy.yaml"
	if data, err := os.ReadFile(repoConfigPath); err == nil {
		_ = yaml.Unmarshal(data, cfg)
	}

	if cfg.Jev.CandidateModels <= 0 {
		cfg.Jev.CandidateModels = 5
	}

	return cfg, nil
}

func (c *Config) Save(local bool) (string, error) {
	targetPath := filepath.Join(c.GlobalDir, "config.yaml")
	if local {
		targetPath = ".harness-proxy.yaml"
	}
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return "", err
	}
	out, err := yaml.Marshal(c)
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(targetPath, out, 0644); err != nil {
		return "", err
	}
	return targetPath, nil
}
