package desktop

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

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
