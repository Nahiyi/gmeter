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

      <section className="signal-board" aria-label={props.t("summary.liveSignals")}>
        <div className="trace-heading">{props.t("summary.liveSignals")}</div>
        {props.metrics.map(([label, value]) => (
          <div className="signal-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="console-panel">
        <div className="trace-heading">{props.t("summary.eventConsole")}</div>
        <div className="console">
          {props.consoleLines.map((line, index) => (
            <div className={index === 0 ? "console-line" : "console-line muted"} key={`${line}-${index}`}>
              {line}
            </div>
          ))}
        </div>
      </section>
      <div className="trace-list">
        <div className="trace-heading">{props.t("trace.recent")}</div>
        {props.recentTraces.length === 0 ? (
          <div className="trace-empty">{props.t("trace.empty")}</div>
        ) : (
          props.recentTraces.slice(0, 8).map((trace, index) => (
            <button className={`trace-row ${isSelectedTrace(trace, props.selectedTrace) ? "selected" : ""}`} type="button" onClick={() => props.setSelectedTrace(trace)} key={`${trace.threadId}-${trace.loopIndex}-${trace.requestIndex}-${index}`}>
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

function isSelectedTrace(trace: desktop.TraceDTO, selectedTrace: desktop.TraceDTO | null) {
  if (!selectedTrace) return false;
  return trace.threadId === selectedTrace.threadId
    && trace.loopIndex === selectedTrace.loopIndex
    && trace.requestIndex === selectedTrace.requestIndex
    && trace.url === selectedTrace.url;
}
