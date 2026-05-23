package engine

import (
	"gmeter/internal/collector"
	"gmeter/internal/reporter"
)

// GenerateReport keeps reporter as the stable JSON-report boundary.
func GenerateReport(records []collector.ThreadRecord, durationMs int64) reporter.Report {
	return reporter.Generate(records, durationMs)
}
