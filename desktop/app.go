package desktop

import (
	"context"
	"fmt"
	"sync"
	"time"

	"gmeter/internal/engine"
	"gmeter/internal/reporter"
)

// App exposes GMeter desktop operations to Wails.
type App struct {
	ctx    context.Context
	mu     sync.Mutex
	cancel context.CancelFunc
	result *engine.RunResult
}

// NewApp creates a desktop app service.
func NewApp() *App {
	return &App{}
}

// Startup stores the Wails runtime context.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// ValidatePlan validates a load-test plan and options.
func (a *App) ValidatePlan(plan engine.TestPlan, options DesktopRunOptions) string {
	if err := engine.Validate(plan, options.toEngineOptions()); err != nil {
		return err.Error()
	}
	return ""
}

// StartRun starts a load test. The first desktop milestone runs synchronously;
// Wails event streaming is added after the shell is stable.
func (a *App) StartRun(plan engine.TestPlan, options DesktopRunOptions) (*engine.RunResult, error) {
	a.mu.Lock()
	if a.cancel != nil {
		a.mu.Unlock()
		return nil, fmt.Errorf("a run is already active")
	}
	ctx, cancel := context.WithCancel(context.Background())
	a.cancel = cancel
	a.mu.Unlock()

	result, err := engine.NewRunner().Run(ctx, plan, options.toEngineOptions(), nil)

	a.mu.Lock()
	a.cancel = nil
	if result != nil {
		a.result = result
	}
	a.mu.Unlock()

	return result, err
}

// StopRun requests cancellation of the active run.
func (a *App) StopRun() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cancel == nil {
		return fmt.Errorf("no active run")
	}
	a.cancel()
	return nil
}

// ExportLastReport writes the most recent report to disk.
func (a *App) ExportLastReport(path string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.result == nil {
		return fmt.Errorf("no report available")
	}
	return reporter.Write(a.result.Report, path)
}

// DesktopRunOptions is frontend-friendly because Wails bindings handle numbers
// more predictably than time.Duration.
type DesktopRunOptions struct {
	Threads          int `json:"threads"`
	Loops            int `json:"loops"`
	RampUpSeconds    int `json:"rampUpSeconds"`
	RequestTimeoutMs int `json:"requestTimeoutMs"`
	MaxDurationSec   int `json:"maxDurationSec"`
}

func (o DesktopRunOptions) toEngineOptions() engine.RunOptions {
	return engine.RunOptions{
		Threads:        o.Threads,
		Loops:          o.Loops,
		RampUp:         time.Duration(o.RampUpSeconds) * time.Second,
		RequestTimeout: time.Duration(o.RequestTimeoutMs) * time.Millisecond,
		MaxDuration:    time.Duration(o.MaxDurationSec) * time.Second,
	}
}
