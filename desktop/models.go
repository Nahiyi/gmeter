package desktop

import (
	"gmeter/internal/collector"
	"gmeter/internal/reporter"
)

type RunStatus string

const (
	RunStatusIdle      RunStatus = "idle"
	RunStatusRunning   RunStatus = "running"
	RunStatusCompleted RunStatus = "completed"
	RunStatusCanceled  RunStatus = "canceled"
)

type RunSnapshot struct {
	RunID        string     `json:"runId"`
	Status       RunStatus  `json:"status"`
	StartedAt    string     `json:"startedAt"`
	FinishedAt   string     `json:"finishedAt"`
	Message      string     `json:"message"`
	Summary      SummaryDTO `json:"summary"`
	TraceCount   int        `json:"traceCount"`
	RecentTraces []TraceDTO `json:"recentTraces"`
}

type SummaryDTO struct {
	TotalThreads      int     `json:"totalThreads"`
	TotalLoops        int     `json:"totalLoops"`
	TotalRequests     int     `json:"totalRequests"`
	SuccessCount      int     `json:"successCount"`
	FailCount         int     `json:"failCount"`
	SuccessRate       float64 `json:"successRate"`
	DurationMs        int64   `json:"durationMs"`
	AvgResponseTimeMs float64 `json:"avgResponseTimeMs"`
	MinResponseTimeMs int64   `json:"minResponseTimeMs"`
	MaxResponseTimeMs int64   `json:"maxResponseTimeMs"`
	P50ResponseTimeMs int64   `json:"p50ResponseTimeMs"`
	P90ResponseTimeMs int64   `json:"p90ResponseTimeMs"`
	P99ResponseTimeMs int64   `json:"p99ResponseTimeMs"`
}

type TraceDTO struct {
	ThreadID       int               `json:"threadId"`
	LoopIndex      int               `json:"loopIndex"`
	RequestIndex   int               `json:"requestIndex"`
	URL            string            `json:"url"`
	Method         string            `json:"method"`
	ResponseStatus int               `json:"responseStatus"`
	ResponseTimeMs int64             `json:"responseTimeMs"`
	Success        bool              `json:"success"`
	Error          string            `json:"error"`
	RequestHeaders map[string]string `json:"requestHeaders"`
	ResponseBody   string            `json:"responseBody"`
}

type RunEventDTO struct {
	Type      string    `json:"type"`
	ThreadID  int       `json:"threadId"`
	LoopIndex int       `json:"loopIndex"`
	Trace     *TraceDTO `json:"trace,omitempty"`
}

func summaryDTOFromReport(summary reporter.Summary) SummaryDTO {
	return SummaryDTO{
		TotalThreads:      summary.TotalThreads,
		TotalLoops:        summary.TotalLoops,
		TotalRequests:     summary.TotalRequests,
		SuccessCount:      summary.SuccessCount,
		FailCount:         summary.FailCount,
		SuccessRate:       summary.SuccessRate,
		DurationMs:        summary.DurationMs,
		AvgResponseTimeMs: summary.AvgResponseTimeMs,
		MinResponseTimeMs: summary.MinResponseTimeMs,
		MaxResponseTimeMs: summary.MaxResponseTimeMs,
		P50ResponseTimeMs: summary.P50ResponseTimeMs,
		P90ResponseTimeMs: summary.P90ResponseTimeMs,
		P99ResponseTimeMs: summary.P99ResponseTimeMs,
	}
}

func traceDTOFromRecord(record collector.RequestRecord) TraceDTO {
	return TraceDTO{
		RequestIndex:   record.RequestIndex,
		URL:            record.URL,
		Method:         record.Method,
		ResponseStatus: record.ResponseStatus,
		ResponseTimeMs: record.ResponseTimeMs,
		Success:        record.Success,
		Error:          record.Error,
		RequestHeaders: record.RequestHeaders,
		ResponseBody:   record.ResponseBody,
	}
}
