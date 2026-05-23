package engine

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestValidateRejectsInvalidOptions(t *testing.T) {
	plan := TestPlan{
		Request: RequestSpec{
			Method: "GET",
			URL:    "http://example.com",
		},
	}

	err := Validate(plan, RunOptions{Threads: 0, Loops: 1, RequestTimeout: time.Second})
	if err == nil {
		t.Fatal("expected invalid threads to fail")
	}
}

func TestRunnerRunsRequestsAndGeneratesReport(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("X-User"); got == "" {
			t.Errorf("expected merged user header")
		}
		w.Header().Set("X-Test", "ok")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}))
	defer server.Close()

	plan := TestPlan{
		Request: RequestSpec{
			Method:  "GET",
			URL:     server.URL,
			Headers: map[string]string{"Accept": "text/plain"},
		},
		Users: []UserSpec{
			{Headers: map[string]string{"X-User": "one"}},
			{Headers: map[string]string{"X-User": "two"}},
		},
	}
	opts := RunOptions{Threads: 2, Loops: 2, RequestTimeout: time.Second}

	result, err := NewRunner().Run(context.Background(), plan, opts, nil)
	if err != nil {
		t.Fatalf("Run failed: %v", err)
	}

	if result.Report.Summary.TotalThreads != 2 {
		t.Errorf("expected 2 threads, got %d", result.Report.Summary.TotalThreads)
	}
	if result.Report.Summary.TotalRequests != 4 {
		t.Errorf("expected 4 requests, got %d", result.Report.Summary.TotalRequests)
	}
	if result.Report.Summary.SuccessCount != 4 {
		t.Errorf("expected 4 successes, got %d", result.Report.Summary.SuccessCount)
	}
}

func TestValidateRejectsInsufficientUsers(t *testing.T) {
	plan := TestPlan{
		Request: RequestSpec{Method: "GET", URL: "http://example.com"},
		Users:   []UserSpec{{Headers: map[string]string{"X-User": "one"}}},
	}
	opts := RunOptions{Threads: 2, Loops: 1, RequestTimeout: time.Second}

	err := Validate(plan, opts)
	if err == nil {
		t.Fatal("expected insufficient users to fail")
	}
	if got, want := err.Error(), "insufficient user configs: 1 users for 2 threads"; got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestRunnerEmitsRequestFinishedEvents(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	sink := &recordingSink{}
	plan := TestPlan{Request: RequestSpec{Method: "GET", URL: server.URL}}
	opts := RunOptions{Threads: 1, Loops: 1, RequestTimeout: time.Second}

	_, err := NewRunner().Run(context.Background(), plan, opts, sink)
	if err != nil {
		t.Fatalf("Run failed: %v", err)
	}

	if !sink.hasEvent(EventRequestFinished) {
		t.Fatalf("expected %s event, got %#v", EventRequestFinished, sink.events)
	}
	if !sink.hasEvent(EventRunCompleted) {
		t.Fatalf("expected %s event, got %#v", EventRunCompleted, sink.events)
	}
}

func TestRunnerHonorsContextCancellation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	plan := TestPlan{Request: RequestSpec{Method: "GET", URL: server.URL}}
	opts := RunOptions{Threads: 1, Loops: 1, RequestTimeout: time.Second}

	_, err := NewRunner().Run(ctx, plan, opts, nil)
	if err == nil {
		t.Fatal("expected canceled context to fail")
	}
}

type recordingSink struct {
	events []RunEvent
}

func (s *recordingSink) Publish(event RunEvent) {
	s.events = append(s.events, event)
}

func (s *recordingSink) hasEvent(eventType RunEventType) bool {
	for _, event := range s.events {
		if event.Type == eventType {
			return true
		}
	}
	return false
}
