export type TraceFilter = "all" | "failed" | "success";
export type LatencyRangeFilter = "all" | "fast" | "normal" | "slow";
export type TraceSort = "latest" | "latencyDesc" | "latencyAsc" | "statusAsc";

export type TraceQuery = {
  latencyRange: LatencyRangeFilter;
  search: string;
  sort: TraceSort;
  status: string;
  traceFilter: TraceFilter;
};

export type TraceDTO = {
  threadId: number;
  loopIndex: number;
  requestIndex: number;
  success: boolean;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  responseStatus: number;
  responseTimeMs: number;
  responseBody: string;
  error: string;
};

export type ResultGroup = {
  label: string;
  count: number;
  percent?: number;
};

export type LatencyBucket = {
  label: string;
  count: number;
  percent: number;
};

export type ResultStats = {
  total: number;
  failed: number;
  failureRate: number;
  slowest: TraceDTO | null;
  errorGroups: ResultGroup[];
  statusGroups: ResultGroup[];
  latencyBuckets: LatencyBucket[];
  slowestTraces: TraceDTO[];
};

export function buildResultStats(traces: TraceDTO[]): ResultStats {
  const failed = traces.filter((trace) => !trace.success).length;
  const slowest = traces.reduce<TraceDTO | null>((current, trace) => {
    if (!current || trace.responseTimeMs > current.responseTimeMs) {
      return trace;
    }
    return current;
  }, null);

  return {
    total: traces.length,
    failed,
    failureRate: traces.length === 0 ? 0 : (failed / traces.length) * 100,
    slowest,
    errorGroups: groupTraces(traces.filter((trace) => !trace.success), (trace) => trace.error || `HTTP ${trace.responseStatus || "ERR"}`),
    statusGroups: groupTraces(traces, (trace) => String(trace.responseStatus || "ERR")),
    latencyBuckets: buildLatencyBuckets(traces),
    slowestTraces: [...traces].sort((a, b) => b.responseTimeMs - a.responseTimeMs).slice(0, 5)
  };
}

export function filterTraces(traces: TraceDTO[], filter: TraceFilter, search: string, status: string) {
  return queryTraces(traces, {
    latencyRange: "all",
    search,
    sort: "latest",
    status,
    traceFilter: filter
  });
}

export function queryTraces(traces: TraceDTO[], query: TraceQuery) {
  const normalizedSearch = query.search.trim().toLowerCase();
  return traces.filter((trace) => {
    if (query.traceFilter === "failed" && trace.success) return false;
    if (query.traceFilter === "success" && !trace.success) return false;
    if (query.status !== "all" && String(trace.responseStatus || "ERR") !== query.status) return false;
    if (!matchesLatencyRange(trace, query.latencyRange)) return false;
    if (!normalizedSearch) return true;
    return trace.url.toLowerCase().includes(normalizedSearch) || trace.error.toLowerCase().includes(normalizedSearch);
  }).sort((a, b) => compareTraces(a, b, query.sort));
}

function matchesLatencyRange(trace: TraceDTO, range: LatencyRangeFilter) {
  switch (range) {
    case "fast":
      return trace.responseTimeMs <= 100;
    case "normal":
      return trace.responseTimeMs > 100 && trace.responseTimeMs <= 300;
    case "slow":
      return trace.responseTimeMs > 300;
    case "all":
    default:
      return true;
  }
}

function compareTraces(a: TraceDTO, b: TraceDTO, sort: TraceSort) {
  switch (sort) {
    case "latencyDesc":
      return b.responseTimeMs - a.responseTimeMs;
    case "latencyAsc":
      return a.responseTimeMs - b.responseTimeMs;
    case "statusAsc":
      return String(a.responseStatus || "ERR").localeCompare(String(b.responseStatus || "ERR"));
    case "latest":
    default:
      return 0;
  }
}

function groupTraces(traces: TraceDTO[], labelForTrace: (trace: TraceDTO) => string) {
  const counts = new Map<string, number>();
  traces.forEach((trace) => {
    const label = labelForTrace(trace);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: traces.length === 0 ? 0 : (count / traces.length) * 100 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildLatencyBuckets(traces: TraceDTO[]) {
  const buckets = [
    { label: "0-50ms", max: 50, count: 0 },
    { label: "51-100ms", max: 100, count: 0 },
    { label: "101-300ms", max: 300, count: 0 },
    { label: "301-1000ms", max: 1000, count: 0 },
    { label: ">1000ms", max: Number.POSITIVE_INFINITY, count: 0 }
  ];
  traces.forEach((trace) => {
    const bucket = buckets.find((item) => trace.responseTimeMs <= item.max);
    if (bucket) {
      bucket.count++;
    }
  });
  const total = traces.length;
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: bucket.count,
    percent: total === 0 ? 0 : (bucket.count / total) * 100
  }));
}
