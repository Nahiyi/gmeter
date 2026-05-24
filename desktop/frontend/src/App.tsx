import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { GetRunSnapshot, StartRun, StopRun, ValidatePlan } from "../wailsjs/go/desktop/App";
import { desktop, engine } from "../wailsjs/go/models";
import { EventsOn } from "../wailsjs/runtime/runtime";
import { ConfigEditor } from "./components/config/ConfigEditor";
import { ResultsWorkbench } from "./components/results/ResultsWorkbench";
import { RunSetupPanel } from "./components/RunSetupPanel";
import { RunSummaryPanel } from "./components/RunSummaryPanel";
import { Titlebar } from "./components/Titlebar";
import { getSavedLocale, I18nKey, Locale, saveLocale, translate } from "./i18n";
import { buildResultStats, LatencyRangeFilter, queryTraces, TraceFilter, TraceSort } from "./resultStats";
import type { GmeterConfig, RequestConfig, UserRow, WorkbenchView } from "./types/config";
import { createID, headersFromRows, rowsFromHeaders } from "./utils/configRows";
import { statusKeyFromRun } from "./utils/status";

type RunEvent = {
  trace?: desktop.TraceDTO;
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
  const [dryRun, setDryRun] = useState(false);
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
  const [latencyRange, setLatencyRange] = useState<LatencyRangeFilter>("all");
  const [traceSearch, setTraceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [traceSort, setTraceSort] = useState<TraceSort>("latest");
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
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
  const requestHeaderCount = useMemo(() => requestHeaders.filter((header) => header.key.trim()).length, [requestHeaders]);
  const userHeaderCount = useMemo(
    () => users.reduce((total, user) => total + user.headers.filter((header) => header.key.trim()).length, 0),
    [users]
  );
  const bodyBytes = useMemo(() => new Blob([body]).size, [body]);
  const statusOptions = useMemo(() => {
    const statuses = new Set(recentTraces.map((trace) => String(trace.responseStatus || "ERR")));
    return Array.from(statuses).sort((a, b) => a.localeCompare(b));
  }, [recentTraces]);
  const filteredTraces = useMemo(
    () => queryTraces(recentTraces, { latencyRange, search: traceSearch, sort: traceSort, status: statusFilter, traceFilter }),
    [latencyRange, recentTraces, statusFilter, traceFilter, traceSearch, traceSort]
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
      maxDurationSec: 0,
      dryRun
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
      if (dryRun) {
        await StartRun(plan, runOptions());
        setStatusKey("status.complete");
        appendConsole(t("console.validationPassed"));
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
      <Titlebar
        fileInputRef={fileInputRef}
        isRunning={isRunning}
        locale={locale}
        onLocaleChange={(nextLocale) => {
          setLocale(nextLocale);
          saveLocale(nextLocale);
        }}
        onOpenClick={handleOpenClick}
        onOpenFile={handleOpenFile}
        onRun={handleRun}
        onSave={handleSave}
        onStop={handleStop}
        t={t}
      />

      <section className={`workspace ${isSetupCollapsed ? "setup-collapsed" : ""} ${isSummaryCollapsed ? "summary-collapsed" : ""}`}>
        <RunSetupPanel
          bodyBytes={bodyBytes}
          dryRun={dryRun}
          isCollapsed={isSetupCollapsed}
          loops={loops}
          rampUpSeconds={rampUpSeconds}
          requestHeaderCount={requestHeaderCount}
          requestMethod={method}
          requestTimeoutMs={requestTimeoutMs}
          requestURL={url}
          setCollapsed={setIsSetupCollapsed}
          setDryRun={setDryRun}
          setLoops={setLoops}
          setRampUpSeconds={setRampUpSeconds}
          setRequestTimeoutMs={setRequestTimeoutMs}
          setThreads={setThreads}
          status={status}
          t={t}
          threads={threads}
          userHeaderCount={userHeaderCount}
          usersCount={users.length}
        />

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
              latencyRange={latencyRange}
              filteredTraces={filteredTraces}
              recentTraces={recentTraces}
              resultStats={resultStats}
              selectedTrace={selectedTrace}
              setLatencyRange={setLatencyRange}
              setSelectedTrace={setSelectedTrace}
              setStatusFilter={setStatusFilter}
              setTraceFilter={setTraceFilter}
              setTraceSearch={setTraceSearch}
              setTraceSort={setTraceSort}
              statusFilter={statusFilter}
              statusOptions={statusOptions}
              t={t}
              traceFilter={traceFilter}
              traceSearch={traceSearch}
              traceSort={traceSort}
            />
          )}
        </section>

        <RunSummaryPanel
          consoleLines={consoleLines}
          isCollapsed={isSummaryCollapsed}
          metrics={metrics}
          recentTraces={recentTraces}
          selectedTrace={selectedTrace}
          setCollapsed={setIsSummaryCollapsed}
          setSelectedTrace={setSelectedTrace}
          status={status}
          t={t}
        />
      </section>
    </main>
  );
}

export default App;
