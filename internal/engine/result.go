package engine

import (
	"time"

	"gmeter/internal/collector"
	"gmeter/internal/reporter"
)

// RunResult contains the completed execution output.
type RunResult struct {
	StartedAt  time.Time
	FinishedAt time.Time
	Duration   time.Duration
	Records    []collector.ThreadRecord
	Report     reporter.Report
}
