import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildResultStats, filterTraces, queryTraces } from "./resultStats.js";
import type { TraceDTO } from "./resultStats.js";

const traces: TraceDTO[] = [
  {
    threadId: 0,
    loopIndex: 0,
    requestIndex: 0,
    success: true,
    method: "GET",
    url: "https://example.com/fast",
    requestHeaders: {},
    responseStatus: 200,
    responseTimeMs: 24,
    responseBody: "ok",
    error: ""
  },
  {
    threadId: 1,
    loopIndex: 0,
    requestIndex: 0,
    success: false,
    method: "GET",
    url: "https://example.com/fail",
    requestHeaders: {},
    responseStatus: 503,
    responseTimeMs: 340,
    responseBody: "",
    error: "upstream unavailable"
  },
  {
    threadId: 2,
    loopIndex: 1,
    requestIndex: 0,
    success: true,
    method: "POST",
    url: "https://example.com/slow",
    requestHeaders: {},
    responseStatus: 200,
    responseTimeMs: 1200,
    responseBody: "ok",
    error: ""
  }
];

describe("buildResultStats", () => {
  it("summarizes failures, status groups, latency buckets, and slowest traces", () => {
    const stats = buildResultStats(traces);

    assert.equal(stats.total, 3);
    assert.equal(stats.success, 2);
    assert.equal(stats.failed, 1);
    assert.equal(stats.successRate.toFixed(1), "66.7");
    assert.equal(stats.failureRate.toFixed(1), "33.3");
    assert.equal(stats.avgLatencyMs.toFixed(1), "521.3");
    assert.equal(stats.p90LatencyMs, 1200);
    assert.equal(stats.p99LatencyMs, 1200);
    assert.equal(stats.slowest?.url, "https://example.com/slow");
    assert.deepEqual(stats.statusGroups.map((group) => [group.label, group.count]), [["200", 2], ["503", 1]]);
    assert.deepEqual(stats.errorGroups.map((group) => [group.label, group.count]), [["upstream unavailable", 1]]);
    assert.deepEqual(stats.latencyBuckets.map((bucket) => [bucket.label, bucket.count]), [
      ["0-50ms", 1],
      ["51-100ms", 0],
      ["101-300ms", 0],
      ["301-1000ms", 1],
      [">1000ms", 1]
    ]);
    assert.deepEqual(stats.slowestTraces.map((trace) => trace.responseTimeMs), [1200, 340, 24]);
  });
});

describe("filterTraces", () => {
  it("combines success filter, status filter, and text search", () => {
    const filtered = filterTraces(traces, "failed", "upstream", "503");

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].url, "https://example.com/fail");
  });
});

describe("queryTraces", () => {
  it("filters by latency range and sorts matching traces", () => {
    const filtered = queryTraces(traces, {
      latencyRange: "slow",
      search: "",
      sort: "latencyDesc",
      status: "all",
      traceFilter: "all"
    });

    assert.deepEqual(filtered.map((trace) => trace.responseTimeMs), [1200, 340]);
  });
});
