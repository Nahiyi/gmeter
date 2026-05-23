import { desktop } from "../../../wailsjs/go/models";
import type { I18nKey } from "../../i18n";
import type { LatencyBucket, LatencyRangeFilter, ResultGroup, ResultStats, TraceFilter, TraceSort } from "../../resultStats";
import { formatHeaders } from "../../utils/configRows";

export function ResultsWorkbench(props: {
  filteredTraces: desktop.TraceDTO[];
  latencyRange: LatencyRangeFilter;
  recentTraces: desktop.TraceDTO[];
  resultStats: ResultStats;
  selectedTrace: desktop.TraceDTO | null;
  setLatencyRange: (range: LatencyRangeFilter) => void;
  setSelectedTrace: (trace: desktop.TraceDTO) => void;
  setStatusFilter: (status: string) => void;
  setTraceFilter: (filter: TraceFilter) => void;
  setTraceSearch: (search: string) => void;
  setTraceSort: (sort: TraceSort) => void;
  statusFilter: string;
  statusOptions: string[];
  t: (key: I18nKey) => string;
  traceFilter: TraceFilter;
  traceSearch: string;
  traceSort: TraceSort;
}) {
  return (
    <div className="results-workbench">
      <div className="results-kpis">
        <ResultKPI label={props.t("results.totalTraces")} value={String(props.resultStats.total)} />
        <ResultKPI label={props.t("results.failedTraces")} value={String(props.resultStats.failed)} tone={props.resultStats.failed > 0 ? "bad" : undefined} />
        <ResultKPI label={props.t("results.slowest")} value={props.resultStats.slowest ? `${props.resultStats.slowest.responseTimeMs} ms` : "-- ms"} />
        <ResultKPI label={props.t("results.failureRate")} value={`${props.resultStats.failureRate.toFixed(1)}%`} tone={props.resultStats.failureRate > 0 ? "bad" : undefined} />
      </div>

      <DiagnosticsSummary resultStats={props.resultStats} t={props.t} />

      <section className="analysis-strip">
        <GroupSummary title={props.t("results.failureGroups")} groups={props.resultStats.errorGroups} t={props.t} />
        <GroupSummary title={props.t("results.statusGroups")} groups={props.resultStats.statusGroups} t={props.t} />
      </section>

      <section className="visual-strip">
        <LatencyDistribution title={props.t("results.latencyDistribution")} buckets={props.resultStats.latencyBuckets} t={props.t} />
        <StatusDistribution title={props.t("results.statusDistribution")} groups={props.resultStats.statusGroups} t={props.t} />
        <SlowRequests title={props.t("results.slowestRequests")} traces={props.resultStats.slowestTraces} t={props.t} />
      </section>

      <section className="trace-work-area">
        <div className="trace-table-panel">
          <div className="trace-toolbar">
            <div className="filter-group" aria-label={props.t("results.filter")}>
              {(["all", "failed", "success"] as TraceFilter[]).map((filter) => (
                <button key={filter} type="button" className={props.traceFilter === filter ? "active" : ""} onClick={() => props.setTraceFilter(filter)}>
                  {props.t(filter === "all" ? "results.filterAll" : filter === "failed" ? "results.filterFailed" : "results.filterSuccess")}
                </button>
              ))}
            </div>
            <input className="trace-search" value={props.traceSearch} placeholder={props.t("results.search")} onChange={(event) => props.setTraceSearch(event.target.value)} />
            <select className="status-filter" value={props.statusFilter} onChange={(event) => props.setStatusFilter(event.target.value)}>
              <option value="all">{props.t("results.allStatuses")}</option>
              {props.statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select className="latency-filter" value={props.latencyRange} onChange={(event) => props.setLatencyRange(event.target.value as LatencyRangeFilter)}>
              <option value="all">{props.t("results.allLatency")}</option>
              <option value="fast">{props.t("results.fastLatency")}</option>
              <option value="normal">{props.t("results.normalLatency")}</option>
              <option value="slow">{props.t("results.slowLatency")}</option>
            </select>
            <select className="trace-sort" value={props.traceSort} onChange={(event) => props.setTraceSort(event.target.value as TraceSort)}>
              <option value="latest">{props.t("results.sortLatest")}</option>
              <option value="latencyDesc">{props.t("results.sortLatencyDesc")}</option>
              <option value="latencyAsc">{props.t("results.sortLatencyAsc")}</option>
              <option value="statusAsc">{props.t("results.sortStatusAsc")}</option>
            </select>
          </div>

          <div className="trace-table" role="table" aria-label={props.t("results.traceTable")}>
            <div className="trace-table-row trace-table-head" role="row">
              <span>{props.t("results.thread")}</span>
              <span>{props.t("results.loop")}</span>
              <span>{props.t("results.method")}</span>
              <span>{props.t("trace.status")}</span>
              <span>{props.t("results.latency")}</span>
              <span>{props.t("results.url")}</span>
            </div>
            {props.filteredTraces.length === 0 ? (
              <div className="trace-empty">{props.recentTraces.length === 0 ? props.t("results.empty") : props.t("results.noMatches")}</div>
            ) : (
              props.filteredTraces.map((trace, index) => (
                <button
                  className={`trace-table-row ${trace.success ? "" : "failed"} ${props.selectedTrace === trace ? "selected" : ""}`}
                  key={`${trace.threadId}-${trace.loopIndex}-${trace.requestIndex}-${index}`}
                  onClick={() => props.setSelectedTrace(trace)}
                  role="row"
                  type="button"
                >
                  <span>T{trace.threadId}</span>
                  <span>L{trace.loopIndex}</span>
                  <span>{trace.method}</span>
                  <strong className={trace.success ? "ok" : "bad"}>{trace.responseStatus || "ERR"}</strong>
                  <span>{trace.responseTimeMs}ms</span>
                  <span className="url-cell">{trace.url}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <TraceInspector trace={props.selectedTrace} t={props.t} />
      </section>
    </div>
  );
}

function DiagnosticsSummary(props: { resultStats: ResultStats; t: (key: I18nKey) => string }) {
  const dominantStatus = props.resultStats.statusGroups[0];
  const items = props.resultStats.total === 0 ? [
    props.t("results.diagnosticsNoData")
  ] : [
    props.resultStats.failed > 0
      ? `${props.t("results.diagnosticsFailures")}: ${props.resultStats.failed} / ${props.resultStats.total} (${props.resultStats.failureRate.toFixed(1)}%)`
      : props.t("results.diagnosticsClean"),
    props.resultStats.slowest
      ? `${props.t("results.diagnosticsSlowest")}: T${props.resultStats.slowest.threadId} L${props.resultStats.slowest.loopIndex} ${props.resultStats.slowest.responseTimeMs}ms`
      : props.t("results.diagnosticsNoData"),
    dominantStatus
      ? `${props.t("results.diagnosticsStatusMix")}: ${dominantStatus.label} (${(dominantStatus.percent ?? 0).toFixed(0)}%)`
      : props.t("results.diagnosticsNoData")
  ];

  return (
    <section className="diagnostics-strip" aria-label={props.t("results.diagnostics")}>
      <div className="diagnostics-title">{props.t("results.diagnostics")}</div>
      <div className="diagnostics-items">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function ResultKPI(props: { label: string; value: string; tone?: "bad" }) {
  return (
    <div className={`result-kpi ${props.tone ?? ""}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function GroupSummary(props: { title: string; groups: ResultGroup[]; t: (key: I18nKey) => string }) {
  return (
    <div className="group-summary">
      <div className="trace-heading">{props.title}</div>
      {props.groups.length === 0 ? (
        <div className="trace-empty">{props.t("results.none")}</div>
      ) : (
        props.groups.slice(0, 5).map((group) => (
          <div className="group-row" key={group.label}>
            <span>{group.label}</span>
            <strong>{group.count}</strong>
          </div>
        ))
      )}
    </div>
  );
}

function LatencyDistribution(props: { title: string; buckets: LatencyBucket[]; t: (key: I18nKey) => string }) {
  return (
    <div className="distribution-panel">
      <div className="trace-heading">{props.title}</div>
      {props.buckets.every((bucket) => bucket.count === 0) ? (
        <div className="trace-empty">{props.t("results.none")}</div>
      ) : (
        <div className="bar-list">
          {props.buckets.map((bucket) => (
            <div className="bar-row" key={bucket.label}>
              <span>{bucket.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${bucket.percent}%` }} /></div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDistribution(props: { title: string; groups: ResultGroup[]; t: (key: I18nKey) => string }) {
  return (
    <div className="distribution-panel">
      <div className="trace-heading">{props.title}</div>
      {props.groups.length === 0 ? (
        <div className="trace-empty">{props.t("results.none")}</div>
      ) : (
        <div className="bar-list">
          {props.groups.slice(0, 6).map((group) => (
            <div className="bar-row" key={group.label}>
              <span>{group.label}</span>
              <div className="bar-track"><div className="bar-fill status" style={{ width: `${group.percent ?? 0}%` }} /></div>
              <strong>{(group.percent ?? 0).toFixed(0)}%</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlowRequests(props: { title: string; traces: desktop.TraceDTO[]; t: (key: I18nKey) => string }) {
  return (
    <div className="distribution-panel">
      <div className="trace-heading">{props.title}</div>
      {props.traces.length === 0 ? (
        <div className="trace-empty">{props.t("results.none")}</div>
      ) : (
        <div className="slow-list">
          {props.traces.map((trace) => (
            <div className="slow-row" key={`${trace.threadId}-${trace.loopIndex}-${trace.requestIndex}`}>
              <span>T{trace.threadId} L{trace.loopIndex}</span>
              <strong>{trace.responseTimeMs}ms</strong>
              <em>{trace.url}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraceInspector(props: { trace: desktop.TraceDTO | null; t: (key: I18nKey) => string }) {
  if (!props.trace) {
    return (
      <section className="trace-inspector">
        <div className="trace-heading">{props.t("results.traceInspector")}</div>
        <div className="trace-empty">{props.t("trace.noSelection")}</div>
      </section>
    );
  }

  return (
    <section className="trace-inspector">
      <div className="trace-heading">{props.t("results.traceInspector")}</div>
      <div className="inspector-grid">
        <span>{props.t("results.thread")}</span>
        <strong>T{props.trace.threadId}</strong>
        <span>{props.t("results.loop")}</span>
        <strong>L{props.trace.loopIndex}</strong>
        <span>{props.t("results.request")}</span>
        <strong>#{props.trace.requestIndex}</strong>
        <span>{props.t("trace.status")}</span>
        <strong className={props.trace.success ? "ok" : "bad"}>{props.trace.responseStatus || "ERR"}</strong>
        <span>{props.t("results.latency")}</span>
        <strong>{props.trace.responseTimeMs}ms</strong>
      </div>
      <div className="evidence-block">
        <div className="trace-heading small">{props.t("results.requestEvidence")}</div>
        <div className="evidence-line"><span>{props.t("results.method")}</span><strong>{props.trace.method}</strong></div>
        <div className="evidence-line"><span>{props.t("results.url")}</span><strong>{props.trace.url}</strong></div>
        <pre className="detail-pre">{formatHeaders(props.trace.requestHeaders)}</pre>
      </div>
      {props.trace.error ? (
        <div className="evidence-block">
          <div className="trace-heading small">{props.t("results.errorSummary")}</div>
          <pre className="detail-pre bad">{props.trace.error}</pre>
        </div>
      ) : null}
      <div className="evidence-block response-evidence">
        <div className="trace-heading small">{props.t("results.responseEvidence")}</div>
        <pre className="detail-pre">{props.trace.responseBody || props.t("trace.emptyBody")}</pre>
      </div>
    </section>
  );
}
