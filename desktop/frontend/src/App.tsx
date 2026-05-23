import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { GetRunSnapshot, StartRun, StopRun, ValidatePlan } from "../wailsjs/go/desktop/App";
import { desktop, engine } from "../wailsjs/go/models";
import { EventsOn } from "../wailsjs/runtime/runtime";
import { getSavedLocale, I18nKey, Locale, saveLocale, translate } from "./i18n";

type HeaderRow = {
  id: string;
  key: string;
  value: string;
};

type UserRow = {
  id: string;
  headers: HeaderRow[];
};

type RequestConfig = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

type UserConfig = {
  headers?: Record<string, string>;
};

type GmeterConfig = {
  request: RequestConfig;
  users?: UserConfig[];
};

type RunEvent = {
  trace?: desktop.TraceDTO;
};

type WorkbenchView = "config" | "results";
type TraceFilter = "all" | "failed" | "success";

type ResultGroup = {
  label: string;
  count: number;
  percent?: number;
};

type LatencyBucket = {
  label: string;
  count: number;
  percent: number;
};

type ResultStats = {
  total: number;
  failed: number;
  failureRate: number;
  slowest: desktop.TraceDTO | null;
  errorGroups: ResultGroup[];
  statusGroups: ResultGroup[];
  latencyBuckets: LatencyBucket[];
  slowestTraces: desktop.TraceDTO[];
};

const defaultRequest: RequestConfig = {
  url: "https://example.com/api",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: "{}"
};

const defaultUsers: UserRow[] = [
  {
    id: createID(),
    headers: [
      { id: createID(), key: "token", value: "user-token-1" },
      { id: createID(), key: "x-user-id", value: "1001" }
    ]
  }
];

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [threads, setThreads] = useState(10);
  const [rampUpSeconds, setRampUpSeconds] = useState(0);
  const [loops, setLoops] = useState(1);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(5000);
  const [method, setMethod] = useState(defaultRequest.method);
  const [url, setURL] = useState(defaultRequest.url);
  const [requestHeaders, setRequestHeaders] = useState(rowsFromHeaders(defaultRequest.headers ?? {}));
  const [body, setBody] = useState(defaultRequest.body ?? "");
  const [users, setUsers] = useState<UserRow[]>(defaultUsers);
  const [snapshot, setSnapshot] = useState<desktop.RunSnapshot | null>(null);
  const [statusKey, setStatusKey] = useState<I18nKey>("status.idle");
  const [locale, setLocale] = useState<Locale>(getSavedLocale);
  const [selectedTrace, setSelectedTrace] = useState<desktop.TraceDTO | null>(null);
  const [workbenchView, setWorkbenchView] = useState<WorkbenchView>("config");
  const [traceFilter, setTraceFilter] = useState<TraceFilter>("all");
  const [traceSearch, setTraceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consoleLines, setConsoleLines] = useState<string[]>([
    translate(getSavedLocale(), "console.ready")
  ]);
  const t = (key: I18nKey) => translate(locale, key);
  const status = t(statusKey);

  useEffect(() => {
    GetRunSnapshot().then((nextSnapshot) => setSnapshot(nextSnapshot));
    const offSnapshot = EventsOn("gmeter:run:snapshot", (nextSnapshot: desktop.RunSnapshot) => {
      setSnapshot(nextSnapshot);
      setStatusKey(statusKeyFromRun(nextSnapshot.status));
    });
    const offEvent = EventsOn("gmeter:run:event", (event: RunEvent) => {
      if (event.trace) {
        const trace = event.trace;
        appendConsole(`${translate(getSavedLocale(), "trace.consolePrefix")} T${trace.threadId} L${trace.loopIndex}: ${translate(getSavedLocale(), "trace.consoleHTTP")} ${trace.responseStatus} ${translate(getSavedLocale(), "trace.consoleIn")} ${trace.responseTimeMs}ms`);
      }
    });
    return () => {
      offSnapshot();
      offEvent();
    };
  }, []);

  const config = useMemo<GmeterConfig>(
    () => ({
      request: {
        url,
        method,
        headers: headersFromRows(requestHeaders),
        body
      },
      users: users.map((user) => ({
        headers: headersFromRows(user.headers)
      }))
    }),
    [body, method, requestHeaders, url, users]
  );

  const configText = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const summary = snapshot?.summary;
  const recentTraces = snapshot?.recentTraces ?? [];
  const isRunning = snapshot?.status === "running";
  const resultStats = useMemo(() => buildResultStats(recentTraces), [recentTraces]);
  const statusOptions = useMemo(() => {
    const statuses = new Set(recentTraces.map((trace) => String(trace.responseStatus || "ERR")));
    return Array.from(statuses).sort((a, b) => a.localeCompare(b));
  }, [recentTraces]);
  const filteredTraces = useMemo(
    () => filterTraces(recentTraces, traceFilter, traceSearch, statusFilter),
    [recentTraces, statusFilter, traceFilter, traceSearch]
  );

  const metrics = useMemo(
    () => [
      [t("summary.requests"), String(summary?.totalRequests ?? 0)],
      [t("summary.success"), String(summary?.successCount ?? 0)],
      [t("summary.failed"), String(summary?.failCount ?? 0)],
      [t("summary.avg"), summary ? `${summary.avgResponseTimeMs.toFixed(1)} ms` : "-- ms"],
      [t("summary.p90"), summary ? `${summary.p90ResponseTimeMs} ms` : "-- ms"],
      [t("summary.p99"), summary ? `${summary.p99ResponseTimeMs} ms` : "-- ms"]
    ],
    [locale, summary]
  );

  function appendConsole(line: string) {
    setConsoleLines((current) => [line, ...current].slice(0, 8));
  }

  function buildPlan(): engine.TestPlan {
    return new engine.TestPlan({
      Name: "Desktop Run",
      Request: new engine.RequestSpec({
        Method: method,
        URL: url,
        Headers: headersFromRows(requestHeaders),
        Body: body
      }),
      Users: users.map((user) => new engine.UserSpec({
        Headers: headersFromRows(user.headers)
      }))
    });
  }

  function runOptions() {
    return {
      threads,
      loops,
      rampUpSeconds,
      requestTimeoutMs,
      maxDurationSec: 0
    };
  }

  async function handleRun() {
    setStatusKey("status.running");
    appendConsole(t("console.starting"));
    try {
      const plan = buildPlan();
      const validation = await ValidatePlan(plan, runOptions());
      if (validation) {
        setStatusKey("status.invalid");
        appendConsole(`${t("console.validationFailed")}: ${validation}`);
        return;
      }

      const runID = await StartRun(plan, runOptions());
      setWorkbenchView("results");
      appendConsole(`${t("console.runStarted")}: ${runID}`);
    } catch (error) {
      setStatusKey("status.failed");
      appendConsole(`${t("console.runFailed")}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleStop() {
    try {
      await StopRun();
      appendConsole(t("console.stopRequested"));
    } catch (error) {
      appendConsole(`${t("console.stopFailed")}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function handleSave() {
    const blob = new Blob([configText], { type: "application/json" });
    const objectURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectURL;
    link.download = "gmeter-config.json";
    link.click();
    URL.revokeObjectURL(objectURL);
    appendConsole(t("console.exported"));
  }

  function handleOpenClick() {
    fileInputRef.current?.click();
  }

  function handleOpenFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyConfig(JSON.parse(String(reader.result ?? "")) as GmeterConfig);
        appendConsole(`${t("console.loaded")}: ${file.name}`);
      } catch (error) {
        appendConsole(`${t("console.openFailed")}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function applyConfig(nextConfig: GmeterConfig) {
    setMethod(nextConfig.request.method || "GET");
    setURL(nextConfig.request.url || "");
    setRequestHeaders(rowsFromHeaders(nextConfig.request.headers ?? {}));
    setBody(nextConfig.request.body ?? "");
    setUsers((nextConfig.users ?? []).map((user) => ({
      id: createID(),
      headers: rowsFromHeaders(user.headers ?? {})
    })));
  }

  return (
    <main className="app-shell">
      <header className="titlebar">
        <div>
          <strong>{t("app.title")}</strong>
          <span>{t("app.subtitle")}</span>
        </div>
        <div className="titlebar-actions">
          <input ref={fileInputRef} className="file-input" type="file" accept=".json,application/json" onChange={handleOpenFile} />
          <select className="locale-select" value={locale} onChange={(event) => {
            const nextLocale = event.target.value as Locale;
            setLocale(nextLocale);
            saveLocale(nextLocale);
          }}>
            <option value="en">EN</option>
            <option value="zh">中文</option>
          </select>
          <button type="button" onClick={handleOpenClick}>{t("command.open")}</button>
          <button type="button" onClick={handleSave}>{t("command.save")}</button>
          {isRunning ? (
            <button type="button" className="danger" onClick={handleStop}>{t("command.stop")}</button>
          ) : (
            <button type="button" className="primary" onClick={handleRun}>{t("command.run")}</button>
          )}
        </div>
      </header>

      <section className="workspace">
        <aside className="panel setup-panel" aria-label="Run setup">
          <div className="panel-heading">
            <h1>{t("nav.runSetup")}</h1>
            <span className="status idle">{status}</span>
          </div>

          <NumberField label={t("setup.threads")} min={1} value={threads} onChange={setThreads} />
          <NumberField label={t("setup.rampUp")} min={0} value={rampUpSeconds} onChange={setRampUpSeconds} />
          <NumberField label={t("setup.loops")} min={1} value={loops} onChange={setLoops} />
          <NumberField label={t("setup.timeout")} min={1} value={requestTimeoutMs} onChange={setRequestTimeoutMs} />

          <div className="toggle-row">
            <span>{t("setup.dryRun")}</span>
            <input type="checkbox" />
          </div>
        </aside>

        <section className="panel editor-panel" aria-label="Request configuration">
          <div className="panel-heading workbench-heading">
            <h2>{workbenchView === "config" ? t("request.profile") : t("results.workbench")}</h2>
            <span className="workbench-mode">{workbenchView === "config" ? t("request.profileMode") : t("results.mode")}</span>
            <div className="segmented-control" role="tablist">
              <button type="button" className={workbenchView === "config" ? "active" : ""} onClick={() => setWorkbenchView("config")}>{t("view.config")}</button>
              <button type="button" className={workbenchView === "results" ? "active" : ""} onClick={() => setWorkbenchView("results")}>{t("view.results")}</button>
            </div>
          </div>

          {workbenchView === "config" ? (
            <ConfigEditor
              body={body}
              configText={configText}
              method={method}
              requestHeaders={requestHeaders}
              setBody={setBody}
              setMethod={setMethod}
              setRequestHeaders={setRequestHeaders}
              setURL={setURL}
              setUsers={setUsers}
              t={t}
              url={url}
              users={users}
            />
          ) : (
            <ResultsWorkbench
              filteredTraces={filteredTraces}
              recentTraces={recentTraces}
              resultStats={resultStats}
              selectedTrace={selectedTrace}
              setSelectedTrace={setSelectedTrace}
              setStatusFilter={setStatusFilter}
              setTraceFilter={setTraceFilter}
              setTraceSearch={setTraceSearch}
              statusFilter={statusFilter}
              statusOptions={statusOptions}
              t={t}
              traceFilter={traceFilter}
              traceSearch={traceSearch}
            />
          )}
        </section>

        <aside className="panel results-panel" aria-label="Run results">
          <div className="panel-heading">
            <h2>{t("summary.title")}</h2>
            <span>{status}</span>
          </div>

          <div className="metric-grid">
            {metrics.map(([label, value]) => (
              <div className="metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="console">
            {consoleLines.map((line, index) => (
              <div className={index === 0 ? "console-line" : "console-line muted"} key={`${line}-${index}`}>
                {line}
              </div>
            ))}
          </div>
          <div className="trace-list">
            <div className="trace-heading">{t("trace.recent")}</div>
            {recentTraces.length === 0 ? (
              <div className="trace-empty">{t("trace.empty")}</div>
            ) : (
              recentTraces.slice(0, 8).map((trace, index) => (
                <button className="trace-row" type="button" onClick={() => setSelectedTrace(trace)} key={`${trace.threadId}-${trace.loopIndex}-${trace.requestIndex}-${index}`}>
                  <span>T{trace.threadId} / L{trace.loopIndex}</span>
                  <strong className={trace.success ? "ok" : "bad"}>{trace.responseStatus || "ERR"}</strong>
                  <span>{trace.responseTimeMs}ms</span>
                </button>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

function NumberField(props: { label: string; min: number; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      {props.label}
      <input type="number" min={props.min} value={props.value} onChange={(event) => props.onChange(Number(event.target.value))} />
    </label>
  );
}

function ConfigEditor(props: {
  body: string;
  configText: string;
  method: string;
  requestHeaders: HeaderRow[];
  setBody: (body: string) => void;
  setMethod: (method: string) => void;
  setRequestHeaders: (rows: HeaderRow[]) => void;
  setURL: (url: string) => void;
  setUsers: (users: UserRow[]) => void;
  t: (key: I18nKey) => string;
  url: string;
  users: UserRow[];
}) {
  return (
    <div className="request-form">
      <div className="request-line">
        <label>
          {props.t("request.method")}
          <select value={props.method} onChange={(event) => props.setMethod(event.target.value)}>
            {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          {props.t("request.url")}
          <input value={props.url} onChange={(event) => props.setURL(event.target.value)} />
        </label>
      </div>

      <HeaderEditor title={props.t("request.headers")} addLabel={props.t("command.add")} deleteLabel={props.t("command.delete")} keyLabel={props.t("table.key")} valueLabel={props.t("table.value")} rows={props.requestHeaders} onChange={props.setRequestHeaders} />

      <label className="body-editor">
        {props.t("request.body")}
        <textarea spellCheck="false" value={props.body} onChange={(event) => props.setBody(event.target.value)} />
      </label>

      <UserEditor users={props.users} onChange={props.setUsers} t={props.t} />

      <label className="json-preview">
        {props.t("request.jsonPreview")}
        <textarea spellCheck="false" readOnly value={props.configText} />
      </label>
    </div>
  );
}

function ResultsWorkbench(props: {
  filteredTraces: desktop.TraceDTO[];
  recentTraces: desktop.TraceDTO[];
  resultStats: ResultStats;
  selectedTrace: desktop.TraceDTO | null;
  setSelectedTrace: (trace: desktop.TraceDTO) => void;
  setStatusFilter: (status: string) => void;
  setTraceFilter: (filter: TraceFilter) => void;
  setTraceSearch: (search: string) => void;
  statusFilter: string;
  statusOptions: string[];
  t: (key: I18nKey) => string;
  traceFilter: TraceFilter;
  traceSearch: string;
}) {
  return (
    <div className="results-workbench">
      <div className="results-kpis">
        <ResultKPI label={props.t("results.totalTraces")} value={String(props.resultStats.total)} />
        <ResultKPI label={props.t("results.failedTraces")} value={String(props.resultStats.failed)} tone={props.resultStats.failed > 0 ? "bad" : undefined} />
        <ResultKPI label={props.t("results.slowest")} value={props.resultStats.slowest ? `${props.resultStats.slowest.responseTimeMs} ms` : "-- ms"} />
        <ResultKPI label={props.t("results.failureRate")} value={`${props.resultStats.failureRate.toFixed(1)}%`} tone={props.resultStats.failureRate > 0 ? "bad" : undefined} />
      </div>

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

function HeaderEditor(props: { title: string; addLabel: string; deleteLabel: string; keyLabel: string; valueLabel: string; rows: HeaderRow[]; onChange: (rows: HeaderRow[]) => void }) {
  function updateRow(id: string, patch: Partial<HeaderRow>) {
    props.onChange(props.rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  return (
    <section className="table-editor">
      <div className="subheading">
        <span>{props.title}</span>
        <button type="button" onClick={() => props.onChange([...props.rows, { id: createID(), key: "", value: "" }])}>{props.addLabel}</button>
      </div>
      <div className="header-grid header-grid-head">
        <span>{props.keyLabel}</span>
        <span>{props.valueLabel}</span>
        <span />
      </div>
      {props.rows.map((row) => (
        <div className="header-grid" key={row.id}>
          <input value={row.key} onChange={(event) => updateRow(row.id, { key: event.target.value })} />
          <input value={row.value} onChange={(event) => updateRow(row.id, { value: event.target.value })} />
          <button type="button" onClick={() => props.onChange(props.rows.filter((item) => item.id !== row.id))}>{props.deleteLabel}</button>
        </div>
      ))}
    </section>
  );
}

function UserEditor(props: { users: UserRow[]; onChange: (users: UserRow[]) => void; t: (key: I18nKey) => string }) {
  function updateUser(userID: string, headers: HeaderRow[]) {
    props.onChange(props.users.map((user) => user.id === userID ? { ...user, headers } : user));
  }

  return (
    <section className="users-editor">
      <div className="subheading">
        <span>{props.t("request.userHeaders")}</span>
        <button type="button" onClick={() => props.onChange([...props.users, { id: createID(), headers: [] }])}>{props.t("command.addUser")}</button>
      </div>
      {props.users.length === 0 ? (
        <div className="trace-empty">{props.t("request.noUserHeaders")}</div>
      ) : (
        props.users.map((user, index) => (
          <div className="user-block" key={user.id}>
            <div className="user-title">
              <span>{props.t("request.user")} {index + 1}</span>
              <button type="button" onClick={() => props.onChange(props.users.filter((item) => item.id !== user.id))}>{props.t("command.remove")}</button>
            </div>
            <HeaderEditor title={props.t("request.headers")} addLabel={props.t("command.add")} deleteLabel={props.t("command.delete")} keyLabel={props.t("table.key")} valueLabel={props.t("table.value")} rows={user.headers} onChange={(rows) => updateUser(user.id, rows)} />
          </div>
        ))
      )}
    </section>
  );
}

function TraceDetail(props: { trace: desktop.TraceDTO | null; t: (key: I18nKey) => string }) {
  if (!props.trace) {
    return (
      <section className="trace-detail">
        <div className="trace-heading">{props.t("trace.detail")}</div>
        <div className="trace-empty">{props.t("trace.noSelection")}</div>
      </section>
    );
  }

  return (
    <section className="trace-detail">
      <div className="trace-heading">{props.t("trace.detail")}</div>
      <div className="detail-grid">
        <span>{props.t("trace.status")}</span>
        <strong className={props.trace.success ? "ok" : "bad"}>{props.trace.responseStatus || "ERR"}</strong>
        <span>{props.t("trace.time")}</span>
        <strong>{props.trace.responseTimeMs}ms</strong>
      </div>
      {props.trace.error ? (
        <pre className="detail-pre bad">{props.trace.error}</pre>
      ) : null}
      <div className="trace-heading small">{props.t("trace.responseBody")}</div>
      <pre className="detail-pre">{props.trace.responseBody || props.t("trace.emptyBody")}</pre>
    </section>
  );
}

function headersFromRows(rows: HeaderRow[]) {
  return rows.reduce<Record<string, string>>((headers, row) => {
    if (row.key.trim()) {
      headers[row.key.trim()] = row.value;
    }
    return headers;
  }, {});
}

function buildResultStats(traces: desktop.TraceDTO[]): ResultStats {
  const failed = traces.filter((trace) => !trace.success).length;
  const slowest = traces.reduce<desktop.TraceDTO | null>((current, trace) => {
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

function filterTraces(traces: desktop.TraceDTO[], filter: TraceFilter, search: string, status: string) {
  const normalizedSearch = search.trim().toLowerCase();
  return traces.filter((trace) => {
    if (filter === "failed" && trace.success) return false;
    if (filter === "success" && !trace.success) return false;
    if (status !== "all" && String(trace.responseStatus || "ERR") !== status) return false;
    if (!normalizedSearch) return true;
    return trace.url.toLowerCase().includes(normalizedSearch) || trace.error.toLowerCase().includes(normalizedSearch);
  });
}

function groupTraces(traces: desktop.TraceDTO[], labelForTrace: (trace: desktop.TraceDTO) => string) {
  const counts = new Map<string, number>();
  traces.forEach((trace) => {
    const label = labelForTrace(trace);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: traces.length === 0 ? 0 : (count / traces.length) * 100 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildLatencyBuckets(traces: desktop.TraceDTO[]) {
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

function formatHeaders(headers?: Record<string, string>) {
  if (!headers || Object.keys(headers).length === 0) {
    return "{}";
  }
  return JSON.stringify(headers, null, 2);
}

function rowsFromHeaders(headers: Record<string, string>) {
  const rows = Object.entries(headers).map(([key, value]) => ({ id: createID(), key, value }));
  return rows.length > 0 ? rows : [{ id: createID(), key: "", value: "" }];
}

function createID() {
  return Math.random().toString(36).slice(2);
}

function statusKeyFromRun(status?: string): I18nKey {
  switch (status) {
    case "running":
      return "status.running";
    case "completed":
      return "status.complete";
    case "canceled":
      return "status.canceled";
    case "idle":
    default:
      return "status.idle";
  }
}

export default App;
