import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { GetRunSnapshot, StartRun, StopRun, ValidatePlan } from "../wailsjs/go/desktop/App";
import { desktop, engine } from "../wailsjs/go/models";
import { EventsOn } from "../wailsjs/runtime/runtime";

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
  const [status, setStatus] = useState("Idle");
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "Ready. Configure a GMeter load profile, then run."
  ]);

  useEffect(() => {
    GetRunSnapshot().then((nextSnapshot) => setSnapshot(nextSnapshot));
    const offSnapshot = EventsOn("gmeter:run:snapshot", (nextSnapshot: desktop.RunSnapshot) => {
      setSnapshot(nextSnapshot);
      setStatus(statusLabel(nextSnapshot.status));
    });
    const offEvent = EventsOn("gmeter:run:event", (event: RunEvent) => {
      if (event.trace) {
        const trace = event.trace;
        appendConsole(`Trace T${trace.threadId} L${trace.loopIndex}: HTTP ${trace.responseStatus} in ${trace.responseTimeMs}ms`);
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
      ["Requests", String(summary?.totalRequests ?? 0)],
      ["Success", String(summary?.successCount ?? 0)],
      ["Failed", String(summary?.failCount ?? 0)],
      ["Avg", summary ? `${summary.avgResponseTimeMs.toFixed(1)} ms` : "-- ms"],
      ["P90", summary ? `${summary.p90ResponseTimeMs} ms` : "-- ms"],
      ["P99", summary ? `${summary.p99ResponseTimeMs} ms` : "-- ms"]
    ],
    [summary]
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
    setStatus("Running");
    appendConsole("Starting run...");
    try {
      const plan = buildPlan();
      const validation = await ValidatePlan(plan, runOptions());
      if (validation) {
        setStatus("Invalid");
        appendConsole(`Validation failed: ${validation}`);
        return;
      }

      const runID = await StartRun(plan, runOptions());
      appendConsole(`Run started: ${runID}`);
    } catch (error) {
      setStatus("Failed");
      appendConsole(`Run failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleStop() {
    try {
      await StopRun();
      appendConsole("Stop requested.");
    } catch (error) {
      appendConsole(`Stop failed: ${error instanceof Error ? error.message : String(error)}`);
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
    appendConsole("Config exported.");
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
        appendConsole(`Loaded config: ${file.name}`);
      } catch (error) {
        appendConsole(`Open failed: ${error instanceof Error ? error.message : String(error)}`);
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
          <strong>GMeter</strong>
          <span>Desktop Workbench</span>
        </div>
        <div className="titlebar-actions">
          <input ref={fileInputRef} className="file-input" type="file" accept=".json,application/json" onChange={handleOpenFile} />
          <button type="button" onClick={handleOpenClick}>Open</button>
          <button type="button" onClick={handleSave}>Save</button>
          {isRunning ? (
            <button type="button" className="danger" onClick={handleStop}>Stop</button>
          ) : (
            <button type="button" className="primary" onClick={handleRun}>Run</button>
          )}
        </div>
      </header>

      <section className="workspace">
        <aside className="panel setup-panel" aria-label="Run setup">
          <div className="panel-heading">
            <h1>Run Setup</h1>
            <span className="status idle">{status}</span>
          </div>

          <NumberField label="Threads" min={1} value={threads} onChange={setThreads} />
          <NumberField label="Ramp-Up Seconds" min={0} value={rampUpSeconds} onChange={setRampUpSeconds} />
          <NumberField label="Loops Per Thread" min={1} value={loops} onChange={setLoops} />
          <NumberField label="Request Timeout" min={1} value={requestTimeoutMs} onChange={setRequestTimeoutMs} />

          <div className="toggle-row">
            <span>Dry Run</span>
            <input type="checkbox" />
          </div>
        </aside>

        <section className="panel editor-panel" aria-label="Request configuration">
          <div className="panel-heading">
            <h2>Request Profile</h2>
            <span>form + JSON preview</span>
          </div>

          <div className="request-form">
            <div className="request-line">
              <label>
                Method
                <select value={method} onChange={(event) => setMethod(event.target.value)}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                URL
                <input value={url} onChange={(event) => setURL(event.target.value)} />
              </label>
            </div>

            <HeaderEditor title="Request Headers" rows={requestHeaders} onChange={setRequestHeaders} />

            <label className="body-editor">
              Body
              <textarea spellCheck="false" value={body} onChange={(event) => setBody(event.target.value)} />
            </label>

            <UserEditor users={users} onChange={setUsers} />

            <label className="json-preview">
              JSON Preview
              <textarea spellCheck="false" readOnly value={configText} />
            </label>
          </div>
        </section>

        <aside className="panel results-panel" aria-label="Run results">
          <div className="panel-heading">
            <h2>Live Summary</h2>
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
            <div className="trace-heading">Recent Traces</div>
            {recentTraces.length === 0 ? (
              <div className="trace-empty">No request traces yet.</div>
            ) : (
              recentTraces.slice(0, 8).map((trace, index) => (
                <div className="trace-row" key={`${trace.threadId}-${trace.loopIndex}-${trace.requestIndex}-${index}`}>
                  <span>T{trace.threadId} / L{trace.loopIndex}</span>
                  <strong className={trace.success ? "ok" : "bad"}>{trace.responseStatus || "ERR"}</strong>
                  <span>{trace.responseTimeMs}ms</span>
                </div>
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

function HeaderEditor(props: { title: string; rows: HeaderRow[]; onChange: (rows: HeaderRow[]) => void }) {
  function updateRow(id: string, patch: Partial<HeaderRow>) {
    props.onChange(props.rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  return (
    <section className="table-editor">
      <div className="subheading">
        <span>{props.title}</span>
        <button type="button" onClick={() => props.onChange([...props.rows, { id: createID(), key: "", value: "" }])}>Add</button>
      </div>
      <div className="header-grid header-grid-head">
        <span>Key</span>
        <span>Value</span>
        <span />
      </div>
      {props.rows.map((row) => (
        <div className="header-grid" key={row.id}>
          <input value={row.key} onChange={(event) => updateRow(row.id, { key: event.target.value })} />
          <input value={row.value} onChange={(event) => updateRow(row.id, { value: event.target.value })} />
          <button type="button" onClick={() => props.onChange(props.rows.filter((item) => item.id !== row.id))}>Del</button>
        </div>
      ))}
    </section>
  );
}

function UserEditor(props: { users: UserRow[]; onChange: (users: UserRow[]) => void }) {
  function updateUser(userID: string, headers: HeaderRow[]) {
    props.onChange(props.users.map((user) => user.id === userID ? { ...user, headers } : user));
  }

  return (
    <section className="users-editor">
      <div className="subheading">
        <span>User Headers</span>
        <button type="button" onClick={() => props.onChange([...props.users, { id: createID(), headers: [] }])}>Add User</button>
      </div>
      {props.users.length === 0 ? (
        <div className="trace-empty">No user headers. Requests will use shared headers only.</div>
      ) : (
        props.users.map((user, index) => (
          <div className="user-block" key={user.id}>
            <div className="user-title">
              <span>User {index + 1}</span>
              <button type="button" onClick={() => props.onChange(props.users.filter((item) => item.id !== user.id))}>Remove</button>
            </div>
            <HeaderEditor title="Headers" rows={user.headers} onChange={(rows) => updateUser(user.id, rows)} />
          </div>
        ))
      )}
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

function statusLabel(status?: string) {
  switch (status) {
    case "running":
      return "Running";
    case "completed":
      return "Complete";
    case "canceled":
      return "Canceled";
    case "idle":
    default:
      return "Idle";
  }
}

export default App;
