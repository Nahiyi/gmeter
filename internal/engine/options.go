package engine

import (
	"fmt"
	"net/url"
	"strings"
	"time"
)

// RunOptions controls concurrency and execution timing.
type RunOptions struct {
	Threads        int
	Loops          int
	RampUp         time.Duration
	RequestTimeout time.Duration
	MaxDuration    time.Duration
}

// Validate checks whether a test plan can be executed.
func Validate(plan TestPlan, opts RunOptions) error {
	if opts.Threads <= 0 {
		return fmt.Errorf("threads must be > 0")
	}
	if opts.Loops <= 0 {
		return fmt.Errorf("loop must be > 0")
	}
	if opts.RequestTimeout <= 0 {
		return fmt.Errorf("request timeout must be > 0")
	}
	if strings.TrimSpace(plan.Request.Method) == "" {
		return fmt.Errorf("request method is required")
	}
	if strings.TrimSpace(plan.Request.URL) == "" {
		return fmt.Errorf("request url is required")
	}
	parsed, err := url.ParseRequestURI(plan.Request.URL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return fmt.Errorf("request url is invalid")
	}
	if len(plan.Users) > 0 && len(plan.Users) < opts.Threads {
		return fmt.Errorf("insufficient user configs: %d users for %d threads", len(plan.Users), opts.Threads)
	}
	return nil
}
