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
          <div className="panel-heading">
            <h2>{t("request.profile")}</h2>
            <span>{t("request.profileMode")}</span>
          </div>

          <div className="request-form">
            <div className="request-line">
              <label>
                {t("request.method")}
                <select value={method} onChange={(event) => setMethod(event.target.value)}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                {t("request.url")}
                <input value={url} onChange={(event) => setURL(event.target.value)} />
              </label>
            </div>

            <HeaderEditor title={t("request.headers")} addLabel={t("command.add")} deleteLabel={t("command.delete")} keyLabel={t("table.key")} valueLabel={t("table.value")} rows={requestHeaders} onChange={setRequestHeaders} />

            <label className="body-editor">
              {t("request.body")}
              <textarea spellCheck="false" value={body} onChange={(event) => setBody(event.target.value)} />
            </label>

            <UserEditor users={users} onChange={setUsers} t={t} />

            <label className="json-preview">
              {t("request.jsonPreview")}
              <textarea spellCheck="false" readOnly value={configText} />
            </label>
          </div>
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
          <TraceDetail trace={selectedTrace} t={t} />
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
