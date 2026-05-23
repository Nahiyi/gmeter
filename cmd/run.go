package cmd

import (
	"context"
	"fmt"
	"time"

	"gmeter/internal/config"
	"gmeter/internal/engine"
	"gmeter/internal/reporter"

	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Run pressure test",
	RunE:  runPressureTest,
}

func runPressureTest(cmd *cobra.Command, args []string) error {
	// Load config
	cfg, err := config.Load(configFile)
	if err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// Dry run mode - just validate config
	if dryRun {
		fmt.Println("Config is valid:")
		fmt.Printf("  URL: %s\n", cfg.Request.URL)
		fmt.Printf("  Method: %s\n", cfg.Request.Method)
		fmt.Printf("  Users: %d\n", len(cfg.Users))
		return nil
	}

	plan := engine.TestPlanFromConfig(cfg)
	opts := engine.RunOptions{
		Threads:        threads,
		Loops:          loop,
		RampUp:         time.Duration(rampUp) * time.Second,
		RequestTimeout: time.Duration(requestTimeout) * time.Millisecond,
		MaxDuration:    time.Duration(maxDuration) * time.Second,
	}

	result, err := engine.NewRunner().Run(context.Background(), plan, opts, nil)
	if err != nil && result == nil {
		return err
	}

	if result == nil {
		return fmt.Errorf("run did not produce a result")
	}
	return reporter.Write(result.Report, outputFile)
}
