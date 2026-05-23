package engine

import (
	"time"

	"gmeter/internal/collector"
)

// RunEventType identifies an event emitted by a running test.
type RunEventType string

const (
	EventRunStarted      RunEventType = "run_started"
	EventThreadStarted   RunEventType = "thread_started"
	EventRequestFinished RunEventType = "request_finished"
	EventThreadFinished  RunEventType = "thread_finished"
	EventRunCompleted    RunEventType = "run_completed"
	EventRunCanceled     RunEventType = "run_canceled"
	EventRunFailed       RunEventType = "run_failed"
)

// RunEvent is the shared event shape used by desktop and future CLI progress.
type RunEvent struct {
	Type      RunEventType
	Time      time.Time
	ThreadID  int
	LoopIndex int
	Request   *collector.RequestRecord
	Error     string
}

// EventSink receives live execution events.
type EventSink interface {
	Publish(RunEvent)
}

func publish(sink EventSink, event RunEvent) {
	if sink != nil {
		event.Time = time.Now()
		sink.Publish(event)
	}
}
