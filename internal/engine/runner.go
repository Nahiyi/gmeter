package engine

import (
	"context"
	"errors"
	"sync"
	"time"

	"gmeter/internal/collector"
	"gmeter/internal/httpclient"
)

// Runner executes a load test plan.
type Runner interface {
	Run(ctx context.Context, plan TestPlan, opts RunOptions, sink EventSink) (*RunResult, error)
}

type defaultRunner struct{}

// NewRunner creates the default shared load-test runner.
func NewRunner() Runner {
	return &defaultRunner{}
}

func (r *defaultRunner) Run(ctx context.Context, plan TestPlan, opts RunOptions, sink EventSink) (*RunResult, error) {
	if err := Validate(plan, opts); err != nil {
		return nil, err
	}
	if err := ctx.Err(); err != nil {
		publish(sink, RunEvent{Type: EventRunCanceled, Error: err.Error()})
		return nil, err
	}

	runCtx := ctx
	cancel := func() {}
	if opts.MaxDuration > 0 {
		runCtx, cancel = context.WithTimeout(ctx, opts.MaxDuration)
	}
	defer cancel()

	client := httpclient.New(int(opts.RequestTimeout / time.Millisecond))
	coll := collector.New()
	startedAt := time.Now()
	publish(sink, RunEvent{Type: EventRunStarted})

	var startDelay time.Duration
	if opts.RampUp > 0 {
		startDelay = opts.RampUp / time.Duration(opts.Threads)
	}

	var wg sync.WaitGroup
	for i := 0; i < opts.Threads; i++ {
		if err := runCtx.Err(); err != nil {
			break
		}

		threadIndex := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			runThread(runCtx, threadIndex, plan, opts, client, coll, sink)
		}()

		if startDelay > 0 {
			select {
			case <-runCtx.Done():
				break
			case <-time.After(startDelay):
			}
		}
	}

	wg.Wait()
	finishedAt := time.Now()
	duration := finishedAt.Sub(startedAt)
	records := coll.GetAllRecords()
	report := GenerateReport(records, duration.Milliseconds())
	result := &RunResult{
		StartedAt:  startedAt,
		FinishedAt: finishedAt,
		Duration:   duration,
		Records:    records,
		Report:     report,
	}

	if err := runCtx.Err(); err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			publish(sink, RunEvent{Type: EventRunCanceled, Error: err.Error()})
			return result, err
		}
		publish(sink, RunEvent{Type: EventRunFailed, Error: err.Error()})
		return result, err
	}

	publish(sink, RunEvent{Type: EventRunCompleted})
	return result, nil
}

func runThread(ctx context.Context, threadIndex int, plan TestPlan, opts RunOptions, client *httpclient.Client, coll *collector.Collector, sink EventSink) {
	idx := coll.NewThreadRecord(threadIndex)
	publish(sink, RunEvent{Type: EventThreadStarted, ThreadID: threadIndex})

	user := UserSpec{}
	if len(plan.Users) > 0 {
		user = plan.Users[threadIndex%len(plan.Users)]
	}

	for loopIndex := 0; loopIndex < opts.Loops; loopIndex++ {
		if ctx.Err() != nil {
			break
		}

		headers := mergeHeaders(plan.Request.Headers, user.Headers)
		result := client.DoRequest(ctx, plan.Request.Method, plan.Request.URL, headers, plan.Request.Body)
		record := collector.RequestRecord{
			RequestIndex:    loopIndex,
			URL:             plan.Request.URL,
			Method:          plan.Request.Method,
			RequestHeaders:  headers,
			RequestBody:     plan.Request.Body,
			ResponseStatus:  result.ResponseStatus,
			ResponseTimeMs:  result.ResponseTimeMs,
			ResponseHeaders: result.ResponseHeaders,
			ResponseBody:    result.ResponseBody,
			Success:         result.Success,
			Error:           result.Error,
		}

		coll.AddLoopResult(idx, loopIndex, []collector.RequestRecord{record})
		publish(sink, RunEvent{Type: EventRequestFinished, ThreadID: threadIndex, LoopIndex: loopIndex, Request: &record})
	}

	publish(sink, RunEvent{Type: EventThreadFinished, ThreadID: threadIndex})
}

func mergeHeaders(shared, user map[string]string) map[string]string {
	merged := make(map[string]string)
	for k, v := range shared {
		merged[k] = v
	}
	for k, v := range user {
		merged[k] = v
	}
	return merged
}
