package desktop

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"gmeter/internal/collector"
	"gmeter/internal/engine"
)

func TestValidatePlanReturnsMessage(t *testing.T) {
	app := NewApp()

	msg := app.ValidatePlan(engine.TestPlan{}, DesktopRunOptions{})
	if msg == "" {
		t.Fatal("expected validation message")
	}
}

func TestStartRunStoresResultForExport(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	app := NewApp()
	plan := engine.TestPlan{Request: engine.RequestSpec{Method: "GET", URL: server.URL}}
	options := DesktopRunOptions{Threads: 1, Loops: 1, RequestTimeoutMs: 1000}

	_, err := app.StartRun(plan, options)
	if err != nil {
		t.Fatalf("StartRun failed: %v", err)
	}
	snapshot := waitForRunStatus(t, app, RunStatusCompleted)
	if snapshot.Summary.TotalRequests != 1 {
		t.Fatalf("expected 1 request, got %d", snapshot.Summary.TotalRequests)
	}

	file, err := os.CreateTemp("", "gmeter-report-*.json")
	if err != nil {
		t.Fatal(err)
	}
	path := file.Name()
	file.Close()
	defer os.Remove(path)

	if err := app.ExportLastReport(path); err != nil {
		t.Fatalf("ExportLastReport failed: %v", err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) == 0 {
		t.Fatal("expected exported report content")
	}
}

func TestStartRunReturnsRunIDAndSnapshot(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	app := NewApp()
	plan := engine.TestPlan{Request: engine.RequestSpec{Method: "GET", URL: server.URL}}
	options := DesktopRunOptions{Threads: 1, Loops: 1, RequestTimeoutMs: 1000}

	runID, err := app.StartRun(plan, options)
	if err != nil {
		t.Fatalf("StartRun failed: %v", err)
	}
	if runID == "" {
		t.Fatal("expected run id")
	}

	snapshot := waitForRunStatus(t, app, RunStatusCompleted)
	if snapshot.Summary.TotalRequests != 1 {
		t.Fatalf("expected 1 request, got %d", snapshot.Summary.TotalRequests)
	}
}

func TestStartRunDryRunOnlyValidates(t *testing.T) {
	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	app := NewApp()
	plan := engine.TestPlan{Request: engine.RequestSpec{Method: "GET", URL: server.URL}}
	options := DesktopRunOptions{Threads: 1, Loops: 3, RequestTimeoutMs: 1000, DryRun: true}

	runID, err := app.StartRun(plan, options)
	if err != nil {
		t.Fatalf("StartRun dry run failed: %v", err)
	}
	if runID == "" {
		t.Fatal("expected dry run id")
	}
	if requests != 0 {
		t.Fatalf("dry run should not send requests, got %d", requests)
	}

	snapshot := app.GetRunSnapshot()
	if snapshot.Status != RunStatusCompleted {
		t.Fatalf("expected completed dry run snapshot, got %s", snapshot.Status)
	}
	if snapshot.TraceCount != 0 || snapshot.Summary.TotalRequests != 0 {
		t.Fatalf("expected dry run to keep request counts at zero, got traceCount=%d totalRequests=%d", snapshot.TraceCount, snapshot.Summary.TotalRequests)
	}
}

func TestStopRunCancelsActiveRun(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	app := NewApp()
	plan := engine.TestPlan{Request: engine.RequestSpec{Method: "GET", URL: server.URL}}
	options := DesktopRunOptions{Threads: 1, Loops: 3, RequestTimeoutMs: 1000}

	if _, err := app.StartRun(plan, options); err != nil {
		t.Fatalf("StartRun failed: %v", err)
	}
	if err := app.StopRun(); err != nil {
		t.Fatalf("StopRun failed: %v", err)
	}

	snapshot := waitForRunStatus(t, app, RunStatusCanceled)
	if snapshot.Status != RunStatusCanceled {
		t.Fatalf("expected canceled, got %s", snapshot.Status)
	}
}

func TestDesktopEventSinkCopiesTraceExecutionCoordinates(t *testing.T) {
	app := NewApp()
	sink := desktopEventSink{app: app}
	record := collector.RequestRecord{
		RequestIndex:   3,
		URL:            "https://example.com/api",
		Method:         "GET",
		ResponseStatus: http.StatusOK,
		ResponseTimeMs: 42,
		Success:        true,
	}

	sink.Publish(engine.RunEvent{
		Type:      engine.EventRequestFinished,
		ThreadID:  7,
		LoopIndex: 2,
		Request:   &record,
	})

	snapshot := app.GetRunSnapshot()
	if len(snapshot.RecentTraces) != 1 {
		t.Fatalf("expected one trace, got %d", len(snapshot.RecentTraces))
	}
	trace := snapshot.RecentTraces[0]
	if trace.ThreadID != 7 || trace.LoopIndex != 2 {
		t.Fatalf("expected thread 7 loop 2, got thread %d loop %d", trace.ThreadID, trace.LoopIndex)
	}
	if trace.RequestIndex != 3 {
		t.Fatalf("expected request index 3, got %d", trace.RequestIndex)
	}
}

func waitForRunStatus(t *testing.T, app *App, status RunStatus) RunSnapshot {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		snapshot := app.GetRunSnapshot()
		if snapshot.Status == status {
			return snapshot
		}
		time.Sleep(10 * time.Millisecond)
	}
	return app.GetRunSnapshot()
}
