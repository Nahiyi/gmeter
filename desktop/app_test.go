package desktop

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

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

	result, err := app.StartRun(plan, options)
	if err != nil {
		t.Fatalf("StartRun failed: %v", err)
	}
	if result.Report.Summary.TotalRequests != 1 {
		t.Fatalf("expected 1 request, got %d", result.Report.Summary.TotalRequests)
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
