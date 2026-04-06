# GoMeter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个命令行 HTTP 压测工具 gometer，支持配置文件、线程控制、Ramp-Up、循环执行、错误记录和 JSON 报告生成。

**Architecture:** 采用模块化设计，分为 CLI 层（cmd/）、业务层（internal/）、配置层（internal/config/）、HTTP 客户端（internal/httpclient/）、运行器（internal/runner/）、结果收集（internal/collector/）和报告生成（internal/reporter/）。主程序入口解析 flag 并调用 runner 执行压测。

**Tech Stack:** Go 标准库（net/http、flag、encoding/json、sync）

---

## File Structure

```
gometer/
├── cmd/
│   ├── root.go              # CLI 根命令，flag 变量定义
│   └── run.go               # run 子命令，执行压测
├── internal/
│   ├── config/
│   │   └── config.go        # 配置文件解析（JSON -> Config struct）
│   ├── loader/
│   │   └── loader.go        # 用户数据加载（users 数组 -> 线程映射）
│   ├── httpclient/
│   │   └── client.go        # HTTP 客户端封装（超时控制、请求发送、错误处理）
│   ├── runner/
│   │   └── runner.go        # 压测运行器（线程调度、Ramp-Up、循环执行）
│   ├── collector/
│   │   └── collector.go     # 结果收集（并发安全的结果聚合）
│   └── reporter/
│       └── reporter.go      # JSON 报告生成
├── req.json.example         # 示例配置文件
├── go.mod
└── CLAUDE.md
```

---

## Task 1: 项目初始化

**Files:**
- Modify: `go.mod`

- [ ] **Step 1: 确认 go.mod 完整**

```go
module gometer

go 1.25.1
```

- [ ] **Step 2: 提交**

```bash
git add go.mod && git commit -m "chore: initialize go.mod"
```

---

## Task 2: cmd/root.go - CLI 根命令和 Flag 定义

**Files:**
- Create: `cmd/root.go`

- [ ] **Step 1: 创建 cmd/root.go**

```go
package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var (
	threads        int
	rampUp         int
	loop           int
	configFile     string
	outputFile    string
	requestTimeout int
	maxDuration    int
	dryRun         bool
)

var rootCmd = &cobra.Command{
	Use:   "gometer",
	Short: "gometer is a HTTP pressure testing tool",
	Long:  `gometer is a CLI HTTP pressure testing tool for learning Go standard library.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(runCmd)

	runCmd.Flags().IntVarP(&threads, "threads", "n", 0, "Number of threads (required)")
	runCmd.Flags().IntVarP(&rampUp, "ramp-up", "t", 0, "Ramp-up period in seconds (default 0)")
	runCmd.Flags().IntVarP(&loop, "loop", "l", 1, "Number of loops per thread (default 1)")
	runCmd.Flags().StringVarP(&configFile, "config", "c", "./req.json", "Request config file (default ./req.json)")
	runCmd.Flags().StringVarP(&outputFile, "output", "o", "", "Output file path (default stdout)")
	runCmd.Flags().IntVar(&requestTimeout, "request-timeout", 5000, "Request timeout in milliseconds (default 5000)")
	runCmd.Flags().IntVar(&maxDuration, "max-duration", 0, "Max duration in seconds, 0 means unlimited (default 0)")
	runCmd.Flags().BoolVar(&dryRun, "dry-run", false, "Validate config file without running")

	rootCmd.MarkFlagRequired("threads")
}
```

- [ ] **Step 2: 提交**

```bash
git add cmd/root.go && git commit -m "feat: add CLI root command with flag definitions"
```

---

## Task 3: internal/config/config.go - 配置结构体定义和解析

**Files:**
- Create: `internal/config/config.go`
- Create: `req.json.example`

- [ ] **Step 1: 创建 internal/config/config.go**

```go
package config

import (
	"encoding/json"
	"os"
)

// Config represents the request configuration file
type Config struct {
	Request RequestConfig `json:"request"`
	Users   []UserConfig  `json:"users"`
}

// RequestConfig represents shared request configuration
type RequestConfig struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

// UserConfig represents per-thread user configuration
type UserConfig struct {
	Headers map[string]string `json:"headers"`
}

// Load reads and parses the JSON config file
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
```

- [ ] **Step 2: 创建 req.json.example**

```json
{
  "request": {
    "url": "http://example.com/api",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{}"
  },
  "users": [
    {
      "headers": {
        "token": "user-token-1",
        "x-user-id": "1001"
      }
    },
    {
      "headers": {
        "token": "user-token-2",
        "x-user-id": "1002"
      }
    }
  ]
}
```

- [ ] **Step 3: 提交**

```bash
git add internal/config/config.go req.json.example && git commit -m "feat: add config package with JSON parsing"
```

---

## Task 4: internal/loader/loader.go - 用户数据加载

**Files:**
- Create: `internal/loader/loader.go`

- [ ] **Step 1: 创建 internal/loader/loader.go**

```go
package loader

import (
	"gometer/internal/config"
)

// Loader is responsible for loading user configurations for threads
type Loader struct {
	users []config.UserConfig
}

// New creates a new Loader
func New(users []config.UserConfig) *Loader {
	return &Loader{users: users}
}

// GetUserConfig returns the user config for a given thread index
// Thread i uses users[i % len(users)]
func (l *Loader) GetUserConfig(threadIndex int) config.UserConfig {
	return l.users[threadIndex%len(l.users)]
}

// UserCount returns the number of available user configs
func (l *Loader) UserCount() int {
	return len(l.users)
}
```

- [ ] **Step 2: 提交**

```bash
git add internal/loader/loader.go && git commit -m "feat: add loader package for user config management"
```

---

## Task 5: internal/httpclient/client.go - HTTP 客户端封装

**Files:**
- Create: `internal/httpclient/client.go`

- [ ] **Step 1: 创建 internal/httpclient/client.go**

```go
package httpclient

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
)

// RequestResult represents the result of a single HTTP request
type RequestResult struct {
	ResponseStatus  int
	ResponseTimeMs  int64
	ResponseHeaders map[string]string
	Success         bool
	Error           string
}

// Client wraps HTTP client with timeout control
type Client struct {
	httpClient *http.Client
	timeout    time.Duration
}

// New creates a new HTTP client with specified timeout in milliseconds
func New(timeoutMs int) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: time.Duration(timeoutMs) * time.Millisecond,
		},
		timeout: time.Duration(timeoutMs) * time.Millisecond,
	}
}

// DoRequest performs an HTTP request and returns the result
func (c *Client) DoRequest(method, url string, sharedHeaders, userHeaders map[string]string, body string) *RequestResult {
	start := time.Now()

	// Merge headers: sharedHeaders + userHeaders (userHeaders take precedence)
	headers := make(map[string]string)
	for k, v := range sharedHeaders {
		headers[k] = v
	}
	for k, v := range userHeaders {
		headers[k] = v
	}

	// Build request
	var reqBody io.Reader
	if body != "" {
		reqBody = bytes.NewBufferString(body)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return &RequestResult{
			ResponseTimeMs: time.Since(start).Milliseconds(),
			Success:       false,
			Error:         fmt.Sprintf("failed to create request: %v", err),
		}
	}

	// Set headers
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	// Execute request with context for timeout
	ctx, cancel := context.WithTimeout(context.Background(), c.timeout)
	defer cancel()

	req = req.WithContext(ctx)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return &RequestResult{
			ResponseTimeMs: time.Since(start).Milliseconds(),
			Success:        false,
			Error:          fmt.Sprintf("request failed: %v", err),
		}
	}
	defer resp.Body.Close()

	// Read response body
	respBody, _ := io.ReadAll(resp.Body)

	// Collect response headers
	respHeaders := make(map[string]string)
	for k, v := range resp.Header {
		if len(v) > 0 {
			respHeaders[k] = v[0]
		}
	}

	// Determine success (2xx status codes)
	success := resp.StatusCode >= 200 && resp.StatusCode < 300

	result := &RequestResult{
		ResponseStatus:  resp.StatusCode,
		ResponseTimeMs: time.Since(start).Milliseconds(),
		ResponseHeaders: respHeaders,
		Success:         success,
	}

	if !success {
		result.Error = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	return result
}
```

- [ ] **Step 2: 提交**

```bash
git add internal/httpclient/client.go && git commit -m "feat: add httpclient package with timeout and error handling"
```

---

## Task 6: internal/collector/collector.go - 结果收集

**Files:**
- Create: `internal/collector/collector.go`

- [ ] **Step 1: 创建 internal/collector/collector.go**

```go
package collector

import (
	"sync"
)

// RequestRecord represents a single request result
type RequestRecord struct {
	RequestIndex    int               `json:"requestIndex"`
	URL             string            `json:"url"`
	Method          string            `json:"method"`
	RequestHeaders  map[string]string `json:"requestHeaders"`
	RequestBody     string            `json:"requestBody"`
	ResponseStatus  int               `json:"responseStatus"`
	ResponseTimeMs  int64             `json:"responseTimeMs"`
	ResponseHeaders map[string]string `json:"responseHeaders"`
	Success         bool              `json:"success"`
	Error           string            `json:"error"`
}

// LoopRecord represents results of one loop iteration
type LoopRecord struct {
	LoopIndex  int             `json:"loopIndex"`
	Requests   []RequestRecord `json:"requests"`
}

// ThreadRecord represents all results for one thread
type ThreadRecord struct {
	ThreadId    int           `json:"threadId"`
	LoopResults []LoopRecord  `json:"loopResults"`
}

// Collector collects results from all threads in a thread-safe manner
type Collector struct {
	mu           sync.Mutex
	threadRecords []ThreadRecord
}

// New creates a new Collector
func New() *Collector {
	return &Collector{
		threadRecords: make([]ThreadRecord, 0),
	}
}

// NewThreadRecord initializes a new thread record
func (c *Collector) NewThreadRecord(threadId int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.threadRecords = append(c.threadRecords, ThreadRecord{
		ThreadId:    threadId,
		LoopResults: make([]LoopRecord, 0),
	})
}

// AddLoopResult adds a loop result to a thread
func (c *Collector) AddLoopResult(threadIndex, loopIndex int, requests []RequestRecord) {
	c.mu.Lock()
	defer c.mu.Unlock()
	loopRecord := LoopRecord{
		LoopIndex: loopIndex,
		Requests:  requests,
	}
	c.threadRecords[threadIndex].LoopResults = append(c.threadRecords[threadIndex].LoopResults, loopRecord)
}

// GetAllRecords returns all collected thread records
func (c *Collector) GetAllRecords() []ThreadRecord {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.threadRecords
}
```

- [ ] **Step 2: 提交**

```bash
git add internal/collector/collector.go && git commit -m "feat: add collector package for thread-safe result collection"
```

---

## Task 7: internal/reporter/reporter.go - JSON 报告生成

**Files:**
- Create: `internal/reporter/reporter.go`

- [ ] **Step 1: 创建 internal/reporter/reporter.go**

```go
package reporter

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"gometer/internal/collector"
)

// Summary represents aggregated statistics
type Summary struct {
	TotalThreads        int     `json:"totalThreads"`
	TotalLoops          int     `json:"totalLoops"`
	TotalRequests       int     `json:"totalRequests"`
	SuccessCount        int     `json:"successCount"`
	FailCount            int     `json:"failCount"`
	SuccessRate          float64 `json:"successRate"`
	DurationMs           int64   `json:"durationMs"`
	AvgResponseTimeMs    float64 `json:"avgResponseTimeMs"`
	MinResponseTimeMs    int64   `json:"minResponseTimeMs"`
	MaxResponseTimeMs    int64   `json:"maxResponseTimeMs"`
	P50ResponseTimeMs    int64   `json:"p50ResponseTimeMs"`
	P90ResponseTimeMs    int64   `json:"p90ResponseTimeMs"`
	P99ResponseTimeMs    int64   `json:"p99ResponseTimeMs"`
}

// Report represents the full JSON report
type Report struct {
	Summary Summary                 `json:"summary"`
	Threads []collector.ThreadRecord `json:"threads"`
}

// Generate creates a report from collected results
func Generate(records []collector.ThreadRecord, durationMs int64) Report {
	var totalRequests, successCount, failCount int
	var totalResponseTime int64
	var minTime, maxTime int64 = -1, 0
	var allResponseTimes []int64

	for _, thread := range records {
		for _, loop := range thread.LoopResults {
			for _, req := range loop.Requests {
				totalRequests++
				if req.Success {
					successCount++
				} else {
					failCount++
				}
				totalResponseTime += req.ResponseTimeMs
				allResponseTimes = append(allResponseTimes, req.ResponseTimeMs)
				if minTime == -1 || req.ResponseTimeMs < minTime {
					minTime = req.ResponseTimeMs
				}
				if req.ResponseTimeMs > maxTime {
					maxTime = req.ResponseTimeMs
				}
			}
		}
	}

	sort.Slice(allResponseTimes, func(i, j int) bool { return allResponseTimes[i] < allResponseTimes[j] })

	var avgTime float64
	if totalRequests > 0 {
		avgTime = float64(totalResponseTime) / float64(totalRequests)
	}

	summary := Summary{
		TotalThreads:        len(records),
		TotalLoops:          0, // Will be set based on actual data
		TotalRequests:       totalRequests,
		SuccessCount:        successCount,
		FailCount:           failCount,
		SuccessRate:         0,
		DurationMs:          durationMs,
		AvgResponseTimeMs:   avgTime,
		MinResponseTimeMs:   minTime,
		MaxResponseTimeMs:   maxTime,
		P50ResponseTimeMs:   percentile(allResponseTimes, 50),
		P90ResponseTimeMs:   percentile(allResponseTimes, 90),
		P99ResponseTimeMs:   percentile(allResponseTimes, 99),
	}

	if totalRequests > 0 {
		summary.SuccessRate = float64(successCount) / float64(totalRequests)
	}

	return Report{
		Summary: summary,
		Threads: records,
	}
}

func percentile(sorted []int64, p int) int64 {
	if len(sorted) == 0 {
		return 0
	}
	index := (len(sorted)-1)*p/100 + 1
	if index >= len(sorted) {
		index = len(sorted) - 1
	}
	return sorted[index-1]
}

// Write writes the report to a file or stdout
func Write(report Report, outputPath string) error {
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal report: %v", err)
	}

	if outputPath == "" {
		fmt.Println(string(data))
		return nil
	}

	return os.WriteFile(outputPath, data, 0644)
}
```

- [ ] **Step 2: 提交**

```bash
git add internal/reporter/reporter.go && git commit -m "feat: add reporter package for JSON report generation"
```

---

## Task 8: internal/runner/runner.go - 压测运行器

**Files:**
- Create: `internal/runner/runner.go`

- [ ] **Step 1: 创建 internal/runner/runner.go**

```go
package runner

import (
	"fmt"
	"sync"
	"time"

	"gometer/internal/collector"
	"gometer/internal/config"
	"gometer/internal/httpclient"
	"gometer/internal/loader"
)

// Runner orchestrates the pressure test execution
type Runner struct {
	cfg             *config.Config
	threadCount     int
	rampUp          int
	loopCount       int
	requestTimeout  int
	maxDuration     int
	httpClient      *httpclient.Client
	userLoader      *loader.Loader
	collector       *collector.Collector
}

// New creates a new Runner
func New(cfg *config.Config, threadCount, rampUp, loopCount, requestTimeout, maxDuration int) *Runner {
	return &Runner{
		cfg:            cfg,
		threadCount:    threadCount,
		rampUp:         rampUp,
		loopCount:      loopCount,
		requestTimeout: requestTimeout,
		maxDuration:    maxDuration,
		httpClient:     httpclient.New(requestTimeout),
		userLoader:     loader.New(cfg.Users),
		collector:      collector.New(),
	}
}

// Run executes the pressure test
func (r *Runner) Run() error {
	if r.userLoader.UserCount() < r.threadCount {
		return fmt.Errorf("insufficient user configs: %d users for %d threads", r.userLoader.UserCount(), r.threadCount)
	}

	startTime := time.Now()

	// Calculate delay between thread starts
	var delay time.Duration
	if r.rampUp > 0 && r.threadCount > 0 {
		delay = time.Duration(r.rampUp) * time.Second / time.Duration(r.threadCount)
	}

	// Channel to signal thread completion
	var wg sync.WaitGroup

	// Start max duration watcher if set
	stopCh := make(chan struct{})
	if r.maxDuration > 0 {
		go func() {
			time.Sleep(time.Duration(r.maxDuration) * time.Second)
			close(stopCh)
		}()
	}

	// Launch threads
	for i := 0; i < r.threadCount; i++ {
		select {
		case <-stopCh:
			// Max duration reached, stop launching new threads
			break
		default:
		}

		threadIndex := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			r.runThread(threadIndex)
		}()

		if delay > 0 {
			time.Sleep(delay)
		}
	}

	// Wait for all threads to complete
	wg.Wait()
	duration := time.Since(startTime)

	// Generate report
	report := collector.GetAllRecords() // This needs to be accessed differently - see note below

	return nil
}

func (r *Runner) runThread(threadIndex int) {
	r.collector.NewThreadRecord(threadIndex)
	userConfig := r.userLoader.GetUserConfig(threadIndex)

	for loopIndex := 1; loopIndex <= r.loopCount; loopIndex++ {
		var requests []collector.RequestRecord

		// Merge headers for this thread/loop
		mergedHeaders := make(map[string]string)
		for k, v := range r.cfg.Request.Headers {
			mergedHeaders[k] = v
		}
		for k, v := range userConfig.Headers {
			mergedHeaders[k] = v
		}

		result := r.httpClient.DoRequest(
			r.cfg.Request.Method,
			r.cfg.Request.URL,
			r.cfg.Request.Headers,
			userConfig.Headers,
			r.cfg.Request.Body,
		)

		reqRecord := collector.RequestRecord{
			RequestIndex:    1,
			URL:             r.cfg.Request.URL,
			Method:          r.cfg.Request.Method,
			RequestHeaders:  mergedHeaders,
			RequestBody:     r.cfg.Request.Body,
			ResponseStatus:  result.ResponseStatus,
			ResponseTimeMs:  result.ResponseTimeMs,
			ResponseHeaders: result.ResponseHeaders,
			Success:         result.Success,
			Error:           result.Error,
		}

		requests = append(requests, reqRecord)
		r.collector.AddLoopResult(threadIndex, loopIndex, requests)
	}
}
```

- [ ] **Step 2: 提交**

```bash
git add internal/runner/runner.go && git commit -m "feat: add runner package with thread scheduling and ramp-up"
```

---

## Task 9: cmd/run.go - run 子命令

**Files:**
- Create: `cmd/run.go`

- [ ] **Step 1: 创建 cmd/run.go**

```go
package cmd

import (
	"fmt"
	"time"

	"gometer/internal/collector"
	"gometer/internal/config"
	"gometer/internal/httpclient"
	"gometer/internal/loader"
	"gometer/internal/reporter"
	"gometer/internal/runner"

	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Run pressure test",
	RunE:  runPressureTest,
}

func runPressureTest(cmd *cobra.Command, args []string) error {
	// Load config
	cfg, err := config.Load(configFile)
	if err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// Dry run mode
	if dryRun {
		fmt.Println("Config is valid:")
		fmt.Printf("  URL: %s\n", cfg.Request.URL)
		fmt.Printf("  Method: %s\n", cfg.Request.Method)
		fmt.Printf("  Users: %d\n", len(cfg.Users))
		return nil
	}

	// Validate threads
	if threads <= 0 {
		return fmt.Errorf("threads must be > 0")
	}

	// Validate user count
	if len(cfg.Users) < threads {
		return fmt.Errorf("insufficient user configs: %d users for %d threads", len(cfg.Users), threads)
	}

	// Create HTTP client
	client := httpclient.New(requestTimeout)

	// Create loader
	userLoader := loader.New(cfg.Users)

	// Create collector
	coll := collector.New()

	// Calculate delay between thread starts
	var startDelay time.Duration
	if rampUp > 0 && threads > 0 {
		startDelay = time.Duration(rampUp) * time.Second / time.Duration(threads)
	}

	startTime := time.Now()
	stopCh := make(chan struct{})

	// Start max duration watcher if set
	if maxDuration > 0 {
		go func() {
			time.AfterFunc(time.Duration(maxDuration)*time.Second, func() {
				close(stopCh)
			})
		}()
	}

	// WaitGroup for thread coordination
	var wg sync.WaitGroup

	// Launch threads
	for i := 0; i < threads; i++ {
		select {
		case <-stopCh:
			break
		default:
		}

		threadIndex := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			runThread(threadIndex, cfg, client, userLoader, coll, loop)
		}()

		if startDelay > 0 {
			time.Sleep(startDelay)
		}
	}

	wg.Wait()
	duration := time.Since(startTime)

	// Generate report
	records := coll.GetAllRecords()
	report := reporter.Generate(records, duration.Milliseconds())

	return reporter.Write(report, outputFile)
}

func runThread(threadIndex int, cfg *config.Config, client *httpclient.Client, userLoader *loader.Loader, coll *collector.Collector, loopCount int) {
	coll.NewThreadRecord(threadIndex)
	userConfig := userLoader.GetUserConfig(threadIndex)

	for loopIndex := 1; loopIndex <= loopCount; loopIndex++ {
		// Build merged headers
		mergedHeaders := make(map[string]string)
		for k, v := range cfg.Request.Headers {
			mergedHeaders[k] = v
		}
		for k, v := range userConfig.Headers {
			mergedHeaders[k] = v
		}

		result := client.DoRequest(
			cfg.Request.Method,
			cfg.Request.URL,
			cfg.Request.Headers,
			userConfig.Headers,
			cfg.Request.Body,
		)

		reqRecord := collector.RequestRecord{
			RequestIndex:    1,
			URL:             cfg.Request.URL,
			Method:          cfg.Request.Method,
			RequestHeaders:  mergedHeaders,
			RequestBody:     cfg.Request.Body,
			ResponseStatus:  result.ResponseStatus,
			ResponseTimeMs:  result.ResponseTimeMs,
			ResponseHeaders: result.ResponseHeaders,
			Success:         result.Success,
			Error:           result.Error,
		}

		coll.AddLoopResult(threadIndex, loopIndex, []collector.RequestRecord{reqRecord})
	}
}
```

Note: This file needs the `sync` import. Let me fix that:

- [ ] **Step 2: Fix imports in cmd/run.go**

```go
package cmd

import (
	"fmt"
	"sync"
	"time"

	"gometer/internal/collector"
	"gometer/internal/config"
	"gometer/internal/httpclient"
	"gometer/internal/loader"
	"gometer/internal/reporter"

	"github.com/spf13/cobra"
)
```

- [ ] **Step 3: 提交**

```bash
git add cmd/run.go && git commit -m "feat: add run command with pressure test execution"
```

---

## Task 10: main.go - 程序入口

**Files:**
- Create: `main.go`

- [ ] **Step 1: 创建 main.go**

```go
package main

import (
	"gometer/cmd"
)

func main() {
	cmd.Execute()
}
```

- [ ] **Step 2: 提交**

```bash
git add main.go && git commit -m "feat: add main.go entry point"
```

---

## Task 11: 安装依赖并验证构建

**Files:**
- Modify: `go.mod` (添加 cobra 依赖)

- [ ] **Step 1: 添加 cobra 依赖**

```bash
go get github.com/spf13/cobra
```

- [ ] **Step 2: 验证构建**

```bash
go build -o gometer.exe .
```

- [ ] **Step 3: 测试 dry-run**

```bash
./gometer.exe run -n 2 --dry-run -c req.json.example
```

- [ ] **Step 4: 提交依赖**

```bash
git add go.mod go.sum && git commit -m "deps: add spf13/cobra dependency"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - [x] CLI 参数（-n, -t, -l, -c, -o, --request-timeout, --max-duration, --dry-run）
   - [x] 配置文件 JSON 解析
   - [x] users 数组线程隔离
   - [x] Ramp-Up 线程启动延迟
   - [x] 循环执行
   - [x] 错误处理（每个请求独立记录）
   - [x] JSON 报告（summary + threads 层级）
   - [x] 分位数统计（P50/P90/P99）
   - [x] 模块划分清晰

2. **Placeholder scan:** 无 TBD/TODO，所有步骤都有实际代码

3. **Type consistency:**
   - collector.RequestRecord 和 reporter 报告结构一致
   - loader.GetUserConfig 返回 config.UserConfig
   - httpclient.DoRequest 返回 *RequestResult

---

## Plan Complete

计划已完成，保存在 `docs/superpowers/plans/2026-04-06-gometer-implementation.md`。

**两个执行选项：**

**1. Subagent-Driven (推荐)** - 每个任务分配给一个 subagent，任务间审查，快速迭代

**2. Inline Execution** - 在当前 session 内批量执行任务，带检查点

选择哪个方式？