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

const metrics = [
  ["Requests", "0"],
  ["Success", "0"],
  ["Failed", "0"],
  ["Avg", "-- ms"],
  ["P90", "-- ms"],
  ["P99", "-- ms"]
];

function App() {
  return (
    <main className="app-shell">
      <header className="titlebar">
        <div>
          <strong>GMeter</strong>
          <span>Desktop Workbench</span>
        </div>
        <div className="titlebar-actions">
          <button type="button">Open</button>
          <button type="button">Save</button>
          <button type="button" className="primary">
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
            <input type="number" min="1" defaultValue="10" />
          </label>
          <label>
            Ramp-Up Seconds
            <input type="number" min="0" defaultValue="0" />
          </label>
          <label>
            Loops Per Thread
            <input type="number" min="1" defaultValue="1" />
          </label>
          <label>
            Request Timeout
            <input type="number" min="1" defaultValue="5000" />
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
          <textarea spellCheck="false" defaultValue={sampleConfig} />
        </section>

        <aside className="panel results-panel" aria-label="Run results">
          <div className="panel-heading">
            <h2>Live Summary</h2>
            <span>Not started</span>
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
            <div className="console-line muted">Ready for Wails bridge wiring.</div>
            <div className="console-line">No run has been started.</div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
