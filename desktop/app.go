package desktop

import (
	"context"
	"fmt"
	"sync"
	"time"

	"gmeter/internal/engine"
	"gmeter/internal/reporter"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App exposes GMeter desktop operations to Wails.
type App struct {
	ctx       context.Context
	mu        sync.Mutex
	activeRun string
	cancel    context.CancelFunc
	snapshot  RunSnapshot
	result    *engine.RunResult
}

// NewApp creates a desktop app service.
func NewApp() *App {
	return &App{
		snapshot: RunSnapshot{Status: RunStatusIdle},
	}
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

// StartRun starts a load test asynchronously and returns the run id.
func (a *App) StartRun(plan engine.TestPlan, options DesktopRunOptions) (string, error) {
	if err := engine.Validate(plan, options.toEngineOptions()); err != nil {
		return "", err
	}

	a.mu.Lock()
	if a.cancel != nil {
		a.mu.Unlock()
		return "", fmt.Errorf("a run is already active")
	}
	ctx, cancel := context.WithCancel(context.Background())
	runID := fmt.Sprintf("run-%d", time.Now().UnixNano())
	a.activeRun = runID
	a.cancel = cancel
	a.result = nil
	a.snapshot = RunSnapshot{
		RunID:     runID,
		Status:    RunStatusRunning,
		StartedAt: time.Now().Format(time.RFC3339),
	}
	a.mu.Unlock()

	go a.runAsync(ctx, runID, plan, options)

	return runID, nil
}

func (a *App) runAsync(ctx context.Context, runID string, plan engine.TestPlan, options DesktopRunOptions) {
	result, err := engine.NewRunner().Run(ctx, plan, options.toEngineOptions(), desktopEventSink{app: a})

	a.mu.Lock()
	a.cancel = nil
	a.activeRun = ""
	if result != nil {
		a.result = result
		a.snapshot.Summary = summaryDTOFromReport(result.Report.Summary)
		a.snapshot.TraceCount = result.Report.Summary.TotalRequests
		a.snapshot.FinishedAt = time.Now().Format(time.RFC3339)
	}
	if err != nil {
		a.snapshot.Status = RunStatusCanceled
		a.snapshot.Message = err.Error()
	} else {
		a.snapshot.Status = RunStatusCompleted
		a.snapshot.Message = "Run completed"
	}
	snapshot := a.snapshot
	a.mu.Unlock()

	a.emit("gmeter:run:snapshot", snapshot)
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

// GetRunSnapshot returns the current desktop run state.
func (a *App) GetRunSnapshot() RunSnapshot {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.snapshot
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

type desktopEventSink struct {
	app *App
}

func (s desktopEventSink) Publish(event engine.RunEvent) {
	dto := RunEventDTO{
		Type:      string(event.Type),
		ThreadID:  event.ThreadID,
		LoopIndex: event.LoopIndex,
	}
	if event.Request != nil {
		trace := traceDTOFromRecord(*event.Request)
		dto.Trace = &trace
	}

	s.app.mu.Lock()
	if dto.Trace != nil {
		s.app.snapshot.TraceCount++
		s.app.snapshot.RecentTraces = append([]TraceDTO{*dto.Trace}, s.app.snapshot.RecentTraces...)
		if len(s.app.snapshot.RecentTraces) > 200 {
			s.app.snapshot.RecentTraces = s.app.snapshot.RecentTraces[:200]
		}
	}
	snapshot := s.app.snapshot
	s.app.mu.Unlock()

	s.app.emit("gmeter:run:event", dto)
	s.app.emit("gmeter:run:snapshot", snapshot)
}

func (a *App) emit(name string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, name, data)
	}
}
