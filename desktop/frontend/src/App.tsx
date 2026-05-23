import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { GetRunSnapshot, StartRun, StopRun, ValidatePlan } from "../wailsjs/go/desktop/App";
import { desktop, engine } from "../wailsjs/go/models";
import { EventsOn } from "../wailsjs/runtime/runtime";

const sampleConfig = `{
  "request": {
    "url": "https://example.com/api",
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
    }
  ]
}`;

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

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [threads, setThreads] = useState(10);
  const [rampUpSeconds, setRampUpSeconds] = useState(0);
  const [loops, setLoops] = useState(1);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(5000);
  const [configText, setConfigText] = useState(sampleConfig);
  const [snapshot, setSnapshot] = useState<desktop.RunSnapshot | null>(null);
  const [status, setStatus] = useState("Idle");
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "Ready. Load or edit a GMeter JSON config, then run."
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

  function parsePlan(): engine.TestPlan {
    const parsed = JSON.parse(configText) as GmeterConfig;
    return new engine.TestPlan({
      Name: "Desktop Run",
      Request: new engine.RequestSpec({
        Method: parsed.request.method,
        URL: parsed.request.url,
        Headers: parsed.request.headers ?? {},
        Body: parsed.request.body ?? ""
      }),
      Users: (parsed.users ?? []).map((user) => new engine.UserSpec({
        Headers: user.headers ?? {}
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
      const plan = parsePlan();
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gmeter-config.json";
    link.click();
    URL.revokeObjectURL(url);
    appendConsole("Config exported from editor.");
  }

  function handleOpenClick() {
    fileInputRef.current?.click();
  }

  function handleOpenFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfigText(String(reader.result ?? ""));
      appendConsole(`Loaded config: ${file.name}`);
    };
    reader.readAsText(file);
    event.target.value = "";
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
            <button type="button" className="danger" onClick={handleStop}>
              Stop
            </button>
          ) : (
            <button type="button" className="primary" onClick={handleRun}>
              Run
            </button>
          )}
        </div>
      </header>

      <section className="workspace">
        <aside className="panel setup-panel" aria-label="Run setup">
          <div className="panel-heading">
            <h1>Run Setup</h1>
            <span className="status idle">Idle</span>
          </div>

          <label>
            Threads
            <input type="number" min="1" value={threads} onChange={(event) => setThreads(Number(event.target.value))} />
          </label>
          <label>
            Ramp-Up Seconds
            <input type="number" min="0" value={rampUpSeconds} onChange={(event) => setRampUpSeconds(Number(event.target.value))} />
          </label>
          <label>
            Loops Per Thread
            <input type="number" min="1" value={loops} onChange={(event) => setLoops(Number(event.target.value))} />
          </label>
          <label>
            Request Timeout
            <input type="number" min="1" value={requestTimeoutMs} onChange={(event) => setRequestTimeoutMs(Number(event.target.value))} />
          </label>

          <div className="toggle-row">
            <span>Dry Run</span>
            <input type="checkbox" />
          </div>
        </aside>

        <section className="panel editor-panel" aria-label="Request configuration">
          <div className="panel-heading">
            <h2>Request Config</h2>
            <span>req.json</span>
          </div>
          <textarea spellCheck="false" value={configText} onChange={(event) => setConfigText(event.target.value)} />
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
