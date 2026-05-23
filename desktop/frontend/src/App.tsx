import { ChangeEvent, useMemo, useRef, useState } from "react";
import { StartRun, ValidatePlan } from "../wailsjs/go/desktop/App";
import { engine, reporter } from "../wailsjs/go/models";

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

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [threads, setThreads] = useState(10);
  const [rampUpSeconds, setRampUpSeconds] = useState(0);
  const [loops, setLoops] = useState(1);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(5000);
  const [configText, setConfigText] = useState(sampleConfig);
  const [summary, setSummary] = useState<reporter.Summary | null>(null);
  const [status, setStatus] = useState("Idle");
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "Ready. Load or edit a GMeter JSON config, then run."
  ]);

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

      const result = await StartRun(plan, runOptions());
      setSummary(result.Report.summary);
      setStatus("Complete");
      appendConsole(`Run complete: ${result.Report.summary.totalRequests} requests, ${(result.Report.summary.successRate * 100).toFixed(1)}% success.`);
    } catch (error) {
      setStatus("Failed");
      appendConsole(`Run failed: ${error instanceof Error ? error.message : String(error)}`);
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
          <button type="button" className="primary" onClick={handleRun}>
            Run
          </button>
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
        </aside>
      </section>
    </main>
  );
}

export default App;
