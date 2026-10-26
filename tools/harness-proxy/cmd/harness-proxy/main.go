package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/benchmark"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/config"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/driver"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/jev"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/ledger"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/quota"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/router"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/tiers"
	"github.com/fernando-delosrios-sp/skills/tools/harness-proxy/internal/worktree"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	subcommand := os.Args[1]
	switch subcommand {
	case "run":
		handleRun(os.Args[2:])
	case "quota":
		handleQuota(os.Args[2:])
	case "sync-models":
		handleSyncModels(os.Args[2:])
	case "tiers":
		handleTiers(os.Args[2:])
	case "models":
		handleModels(os.Args[2:])
	case "config-jev", "configure-jev":
		handleConfigJev(os.Args[2:])
	case "--help", "-h", "help":
		printUsage()
	default:
		// If first arg doesn't match a command, treat arguments as prompt for 'run'
		handleRun(os.Args[1:])
	}
}

func printUsage() {
	fmt.Println(`harness-proxy: AI coding agent harness multiplexer

Usage:
  harness-proxy run [flags] "<prompt>"   Delegate a task to the best available harness
  harness-proxy quota                   Inspect remaining subscription quotas
  harness-proxy models [provider]       List available models by provider & tier
  harness-proxy sync-models [--force]   Sync model benchmark rankings with tiers.yaml
  harness-proxy tiers                   Display current model tier matrix
  harness-proxy config-jev [flags]      Configure Jev task complexity classifier

Flags for 'run':
  --tier <name>        Override model tier (frontier, workhorse, lightweight)
  --provider <name>    Override provider (cursor, antigravity, opencode)
  --no-merge           Do not auto-merge the task branch into active workspace
  --task-id <id>       Explicit task identifier

Flags for 'config-jev':
  --endpoint <url>     OpenAI-compatible endpoint URL (e.g. http://localhost:11434/v1)
  --model <name>       Classifier model name (e.g. qwen2.5-coder:7b)
  --api-key <key>      Bearer token / API key for remote providers
  --local              Save to local repo (.harness-proxy.yaml) instead of global config
  --wizard             Launch interactive configuration wizard`)
}

func handleRun(args []string) {
	fs := flag.NewFlagSet("run", flag.ExitOnError)
	tierFlag := fs.String("tier", "", "Override model tier (frontier, workhorse, lightweight)")
	providerFlag := fs.String("provider", "", "Override provider (cursor, antigravity, opencode)")
	noMergeFlag := fs.Bool("no-merge", false, "Do not auto-merge the task branch into active workspace")
	taskIDFlag := fs.String("task-id", "", "Explicit task identifier")

	_ = fs.Parse(args)
	prompt := strings.Join(fs.Args(), " ")
	if strings.TrimSpace(prompt) == "" {
		fmt.Fprintf(os.Stderr, "Error: prompt cannot be empty\n")
		os.Exit(1)
	}

	taskID := *taskIDFlag
	if taskID == "" {
		taskID = fmt.Sprintf("task-%d", time.Now().Unix())
	}

	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading config: %v\n", err)
		os.Exit(1)
	}

	tm, err := tiers.LoadTiers(cfg.GlobalDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading tiers: %v\n", err)
		os.Exit(1)
	}

	l, err := ledger.LoadLedger(cfg.GlobalDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading ledger: %v\n", err)
		os.Exit(1)
	}

	qm := quota.NewQuotaManager(cfg.CacheDir)
	classifier := jev.NewClassifier(cfg)
	r := router.NewRouter(cfg, classifier, tm, qm, l)

	ctx := context.Background()
	decision, err := r.Resolve(ctx, prompt, *tierFlag, *providerFlag)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Routing Error: %v\n", err)
		os.Exit(2)
	}

	fmt.Printf("🚀 Routing task [%s]: Tier=%s Provider=%s Model=%s\n", taskID, decision.Tier, decision.Provider, decision.Model)
	fmt.Printf("   Reason: %s\n", decision.Reason)

	// Worktree setup
	wtMgr := worktree.NewManager(cfg.Worktree.BaseDir)
	session, err := wtMgr.Create(taskID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Worktree error: %v\n", err)
		os.Exit(1)
	}
	defer session.Cleanup()

	// Execution with failover support
	providerQueue := append([]string{decision.Provider}, decision.AlternativeProviders...)
	var execRes *driver.ExecutionResult
	var activeProvider string
	var activeModel string

	for _, p := range providerQueue {
		d, err := driver.GetDriver(p)
		if err != nil {
			continue
		}
		models := tm.GetModels(decision.Tier, p)
		model := decision.Model
		if p != decision.Provider && len(models) > 0 {
			model = models[0]
		}

		activeProvider = p
		activeModel = model
		fmt.Printf("⚡ Executing via %s (%s)...\n", p, model)

		res, runErr := d.Execute(ctx, session.WorktreeDir, model, prompt)
		if runErr == nil && res.ExitCode == 0 {
			execRes = res
			break
		}

		fmt.Printf("⚠️  Provider %s failed (exit %d), attempting failover...\n", p, res.ExitCode)
		_ = l.Record(ledger.Entry{
			ID:              taskID,
			Provider:        p,
			Model:           model,
			Tier:            string(decision.Tier),
			DurationSeconds: res.Duration.Seconds(),
			Status:          "failover",
			Error:           fmt.Sprintf("exit code %d", res.ExitCode),
		})
	}

	if execRes == nil {
		fmt.Fprintf(os.Stderr, "❌ All candidate providers in tier '%s' failed.\n", decision.Tier)
		os.Exit(3)
	}

	// Commit changes in worktree
	commitMsg := fmt.Sprintf("harness-proxy: [%s] %s", taskID, prompt)
	if len(commitMsg) > 72 {
		commitMsg = commitMsg[:72]
	}
	sha, err := session.Commit(commitMsg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Commit error: %v\n", err)
	}

	// Merge handling
	autoMerge := cfg.Worktree.AutoMerge && !*noMergeFlag
	mergeResult, err := session.MergeIntoActive(autoMerge)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Merge error: %v\n", err)
	}

	status := "success"
	if mergeResult.Conflict {
		status = "conflict"
		fmt.Printf("⚠️  Merge conflict detected! Task branch '%s' has been preserved.\n", mergeResult.Branch)
		fmt.Printf("   Conflicting files:\n")
		for _, f := range mergeResult.ConflictingFiles {
			fmt.Printf("   - %s\n", f)
		}
	} else if mergeResult.Merged {
		fmt.Printf("✅ Changes successfully merged into active branch (commit %s).\n", mergeResult.CommitHash[:8])
	} else {
		fmt.Printf("📦 Changes committed to task branch '%s' (merge skipped).\n", mergeResult.Branch)
	}

	// Record in ledger
	_ = l.Record(ledger.Entry{
		ID:               taskID,
		Provider:         activeProvider,
		Model:            activeModel,
		Tier:             string(decision.Tier),
		PromptTokens:     len(prompt) / 4,
		CompletionTokens: len(execRes.Stdout) / 4,
		DurationSeconds:  execRes.Duration.Seconds(),
		Status:           status,
	})

	_ = sha
}

func formatQuotaVal(val float64, metric string) string {
	switch metric {
	case "$ USD":
		return fmt.Sprintf("$%.2f", val)
	case "% window", "% allowance":
		return fmt.Sprintf("%.1f%%", val)
	default:
		return fmt.Sprintf("%.0f reqs", val)
	}
}

func handleQuota(args []string) {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	l, err := ledger.LoadLedger(cfg.GlobalDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	qm := quota.NewQuotaManager(cfg.CacheDir)
	quotas := qm.InspectAll(context.Background(), cfg, l)

	fmt.Printf("%-13s %-10s %-12s %-12s %-12s %-9s %s\n", "PROVIDER", "STATUS", "REMAINING", "ALLOWANCE", "USED", "PERCENT", "DETAILS")
	fmt.Println(strings.Repeat("-", 100))
	for _, q := range quotas {
		estMarker := ""
		if q.IsEstimate {
			estMarker = " (est)"
		}
		remStr := formatQuotaVal(q.Remaining, q.Metric)
		allowStr := formatQuotaVal(q.TotalAllowance, q.Metric)
		usedStr := formatQuotaVal(q.Used, q.Metric)
		pctStr := fmt.Sprintf("%.1f%%%s", q.PercentUsed, estMarker)

		fmt.Printf("%-13s %-10s %-12s %-12s %-12s %-9s %s\n",
			q.Provider,
			q.Status,
			remStr,
			allowStr,
			usedStr,
			pctStr,
			q.Details,
		)
	}
}

func handleSyncModels(args []string) {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	force := len(args) > 0 && args[0] == "--force"

	fmt.Println("🔄 Synchronizing model benchmark rankings (Artificial Analysis & LiveCodeBench)...")
	bd, err := benchmark.SyncBenchmarks(cfg.CacheDir, force)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Sync error: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ Benchmarks cached (last updated: %s)\n", bd.Timestamp.Format(time.RFC3339))

	tm, err := tiers.LoadTiers(cfg.GlobalDir)
	if err != nil {
		tm = tiers.DefaultTiers()
	}

	// Reset provider mappings for discovery while keeping maps initialized
	if tm.Frontier == nil {
		tm.Frontier = make(tiers.ProviderModels)
	}
	if tm.Workhorse == nil {
		tm.Workhorse = make(tiers.ProviderModels)
	}
	if tm.Lightweight == nil {
		tm.Lightweight = make(tiers.ProviderModels)
	}

	fmt.Println("\n🔍 Discovering installed provider models...")
	for _, p := range cfg.Providers {
		models, discErr := benchmark.DiscoverProviderModels(p)
		if discErr != nil || len(models) == 0 {
			fmt.Printf("  • %-12s: no live models reported or not logged in, keeping defaults\n", p)
			continue
		}

		frontierList := make([]string, 0)
		workhorseList := make([]string, 0)
		lightweightList := make([]string, 0)

		for _, m := range models {
			tier := benchmark.ClassifyModel(m, bd)
			switch tier {
			case tiers.TierFrontier:
				frontierList = append(frontierList, m)
			case tiers.TierWorkhorse:
				workhorseList = append(workhorseList, m)
			case tiers.TierLightweight:
				lightweightList = append(lightweightList, m)
			}
		}

		if len(frontierList) > 0 {
			tm.Frontier[p] = benchmark.SortModelsByCost(frontierList, bd)
		}
		if len(workhorseList) > 0 {
			tm.Workhorse[p] = benchmark.SortModelsByCost(workhorseList, bd)
		}
		if len(lightweightList) > 0 {
			tm.Lightweight[p] = benchmark.SortModelsByCost(lightweightList, bd)
		}

		fmt.Printf("  • %-12s: %d models discovered (%d frontier, %d workhorse, %d lightweight)\n",
			p, len(models), len(frontierList), len(workhorseList), len(lightweightList))
	}

	if err := tiers.SaveTiers(cfg.GlobalDir, tm); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: failed to save tiers.yaml: %v\n", err)
	} else {
		fmt.Printf("\n💾 Successfully updated %s/tiers.yaml\n", cfg.GlobalDir)
	}

	fmt.Println("\nActive Model Tier Alignments:")
	for _, p := range cfg.Providers {
		fmt.Printf("\n[%s]\n", strings.ToUpper(p))
		printTierModels("  • Frontier   ", tm.Frontier[p], 5)
		printTierModels("  • Workhorse  ", tm.Workhorse[p], 5)
		printTierModels("  • Lightweight", tm.Lightweight[p], 5)
	}
}

func printTierModels(label string, models []string, maxDisplay int) {
	if len(models) == 0 {
		fmt.Printf("%s: (none)\n", label)
		return
	}
	display := models
	more := 0
	if len(models) > maxDisplay {
		display = models[:maxDisplay]
		more = len(models) - maxDisplay
	}
	suffix := ""
	if more > 0 {
		suffix = fmt.Sprintf(" ... (+%d more)", more)
	}
	fmt.Printf("%s: %s%s\n", label, strings.Join(display, ", "), suffix)
}

func handleTiers(args []string) {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	tm, err := tiers.LoadTiers(cfg.GlobalDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	data, _ := json.MarshalIndent(tm, "", "  ")
	fmt.Println(string(data))
}

func handleModels(args []string) {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	tm, err := tiers.LoadTiers(cfg.GlobalDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	targetProvider := ""
	if len(args) > 0 {
		targetProvider = strings.ToLower(args[0])
	}

	providers := cfg.Providers
	if targetProvider != "" {
		providers = []string{targetProvider}
	}

	for _, p := range providers {
		fmt.Printf("\n=== %s ===\n", strings.ToUpper(p))
		f := tm.Frontier[p]
		w := tm.Workhorse[p]
		l := tm.Lightweight[p]

		if len(f) == 0 && len(w) == 0 && len(l) == 0 {
			fmt.Println("  (no models configured — run 'harness-proxy sync-models' to discover)")
			continue
		}

		fmt.Printf("\n[FRONTIER] (%d models)\n", len(f))
		for _, m := range f {
			fmt.Printf("  • %s\n", m)
		}

		fmt.Printf("\n[WORKHORSE] (%d models)\n", len(w))
		for _, m := range w {
			fmt.Printf("  • %s\n", m)
		}

		fmt.Printf("\n[LIGHTWEIGHT] (%d models)\n", len(l))
		for _, m := range l {
			fmt.Printf("  • %s\n", m)
		}
	}
}

func handleConfigJev(args []string) {
	fs := flag.NewFlagSet("config-jev", flag.ExitOnError)
	endpointFlag := fs.String("endpoint", "", "Jev OpenAI-compatible endpoint URL (e.g. http://localhost:11434/v1)")
	modelFlag := fs.String("model", "", "Jev classifier model (e.g. qwen2.5-coder:7b)")
	apiKeyFlag := fs.String("api-key", "", "API key for Jev endpoint (optional)")
	localFlag := fs.Bool("local", false, "Save to local .harness-proxy.yaml instead of global config")
	wizardFlag := fs.Bool("wizard", false, "Force interactive wizard mode")

	_ = fs.Parse(args)

	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading configuration: %v\n", err)
		os.Exit(1)
	}

	var endpointSet, modelSet, apiKeySet bool
	fs.Visit(func(f *flag.Flag) {
		switch f.Name {
		case "endpoint":
			endpointSet = true
		case "model":
			modelSet = true
		case "api-key":
			apiKeySet = true
		}
	})

	if *wizardFlag || (!endpointSet && !modelSet && !apiKeySet) {
		runJevWizard(cfg, *localFlag)
		return
	}

	if endpointSet {
		cfg.Jev.Endpoint = *endpointFlag
	}
	if modelSet {
		cfg.Jev.Model = *modelFlag
	}
	if apiKeySet {
		cfg.Jev.APIKey = *apiKeyFlag
	}

	savedPath, err := cfg.Save(*localFlag)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error saving configuration: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✓ Jev configuration updated in %s\n", savedPath)
	fmt.Printf("  Endpoint: %s\n", cfg.Jev.Endpoint)
	fmt.Printf("  Model:    %s\n", cfg.Jev.Model)
	if cfg.Jev.APIKey != "" {
		fmt.Printf("  API Key:  [configured]\n")
	} else {
		fmt.Printf("  API Key:  [none]\n")
	}
}

func runJevWizard(cfg *config.Config, defaultLocal bool) {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("=== Jev Task Classifier Configuration Wizard ===")
	fmt.Println("Configure the OpenAI-compatible endpoint used to classify task complexity.")
	fmt.Println("(Press Enter to keep current/default value)")
	fmt.Println()

	// 1. Endpoint
	currEndpoint := cfg.Jev.Endpoint
	if currEndpoint == "" {
		currEndpoint = "http://localhost:11434/v1"
	}
	fmt.Printf("Endpoint URL [%s]: ", currEndpoint)
	endpointInput, _ := reader.ReadString('\n')
	endpointInput = strings.TrimSpace(endpointInput)
	if endpointInput != "" {
		cfg.Jev.Endpoint = endpointInput
	} else {
		cfg.Jev.Endpoint = currEndpoint
	}

	// 2. Model
	currModel := cfg.Jev.Model
	if currModel == "" {
		currModel = "qwen2.5-coder:7b"
	}
	fmt.Printf("Model name [%s]: ", currModel)
	modelInput, _ := reader.ReadString('\n')
	modelInput = strings.TrimSpace(modelInput)
	if modelInput != "" {
		cfg.Jev.Model = modelInput
	} else {
		cfg.Jev.Model = currModel
	}

	// 3. API Key
	currKeyDesc := "none"
	if cfg.Jev.APIKey != "" {
		currKeyDesc = "***"
	}
	fmt.Printf("API Key (optional, for remote endpoints) [%s]: ", currKeyDesc)
	keyInput, _ := reader.ReadString('\n')
	keyInput = strings.TrimSpace(keyInput)
	if keyInput != "" {
		if keyInput == "none" || keyInput == "clear" {
			cfg.Jev.APIKey = ""
		} else {
			cfg.Jev.APIKey = keyInput
		}
	}

	// 4. Scope
	isLocal := defaultLocal
	if !defaultLocal {
		fmt.Print("Save configuration to [G]lobal (~/.config/harness-proxy/config.yaml) or [L]ocal (.harness-proxy.yaml)? [G]: ")
		scopeInput, _ := reader.ReadString('\n')
		scopeInput = strings.ToLower(strings.TrimSpace(scopeInput))
		if scopeInput == "l" || scopeInput == "local" {
			isLocal = true
		}
	}

	savedPath, err := cfg.Save(isLocal)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error saving configuration: %v\n", err)
		os.Exit(1)
	}

	fmt.Println()
	fmt.Printf("✓ Jev configuration successfully saved to %s\n", savedPath)
	fmt.Printf("  Endpoint: %s\n", cfg.Jev.Endpoint)
	fmt.Printf("  Model:    %s\n", cfg.Jev.Model)
	if cfg.Jev.APIKey != "" {
		fmt.Printf("  API Key:  [configured]\n")
	} else {
		fmt.Printf("  API Key:  [none]\n")
	}
}

