import { desktop } from "../../wailsjs/go/models";
import type { I18nKey } from "../i18n";

export function RunSummaryPanel(props: {
  consoleLines: string[];
  isCollapsed: boolean;
  metrics: string[][];
  recentTraces: desktop.TraceDTO[];
  selectedTrace: desktop.TraceDTO | null;
  setCollapsed: (value: boolean) => void;
  setSelectedTrace: (trace: desktop.TraceDTO) => void;
  status: string;
  t: (key: I18nKey) => string;
}) {
  if (props.isCollapsed) {
    return (
      <aside className="panel results-panel panel-collapsed" aria-label="Run results">
        <button type="button" className="rail-toggle" title={props.t("layout.expandPanel")} onClick={() => props.setCollapsed(false)}>
          <span>{props.t("summary.title")}</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel results-panel" aria-label="Run results">
      <div className="panel-heading">
        <h2>{props.t("summary.title")}</h2>
        <div className="heading-actions">
          <span>{props.status}</span>
          <button type="button" className="collapse-button collapse-right" title={props.t("layout.collapsePanel")} onClick={() => props.setCollapsed(true)}>
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="metric-grid">
        {props.metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="console">
        {props.consoleLines.map((line, index) => (
          <div className={index === 0 ? "console-line" : "console-line muted"} key={`${line}-${index}`}>
            {line}
          </div>
        ))}
      </div>
      <div className="trace-list">
        <div className="trace-heading">{props.t("trace.recent")}</div>
        {props.recentTraces.length === 0 ? (
          <div className="trace-empty">{props.t("trace.empty")}</div>
        ) : (
          props.recentTraces.slice(0, 8).map((trace, index) => (
            <button className="trace-row" type="button" onClick={() => props.setSelectedTrace(trace)} key={`${trace.threadId}-${trace.loopIndex}-${trace.requestIndex}-${index}`}>
              <span>T{trace.threadId} / L{trace.loopIndex}</span>
              <strong className={trace.success ? "ok" : "bad"}>{trace.responseStatus || "ERR"}</strong>
              <span>{trace.responseTimeMs}ms</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
