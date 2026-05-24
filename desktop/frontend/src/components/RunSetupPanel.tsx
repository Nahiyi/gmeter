import type { I18nKey } from "../i18n";
import { NumberField } from "./NumberField";

export function RunSetupPanel(props: {
  isCollapsed: boolean;
  loops: number;
  rampUpSeconds: number;
  requestURL: string;
  requestTimeoutMs: number;
  setCollapsed: (value: boolean) => void;
  setLoops: (value: number) => void;
  setRampUpSeconds: (value: number) => void;
  setRequestTimeoutMs: (value: number) => void;
  setThreads: (value: number) => void;
  status: string;
  t: (key: I18nKey) => string;
  threads: number;
  usersCount: number;
}) {
  const totalRequests = props.threads * props.loops;
  const rampRate = props.rampUpSeconds > 0 ? `${(props.threads / props.rampUpSeconds).toFixed(1)}/s` : props.t("setup.instantRamp");

  if (props.isCollapsed) {
    return (
      <aside className="panel setup-panel panel-collapsed" aria-label="Run setup">
        <button type="button" className="rail-toggle" title={props.t("layout.expandPanel")} onClick={() => props.setCollapsed(false)}>
          <span>{props.t("nav.runSetup")}</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel setup-panel" aria-label="Run setup">
      <div className="panel-heading">
        <h1>{props.t("nav.runSetup")}</h1>
        <div className="heading-actions">
          <span className="status idle">{props.status}</span>
          <button type="button" className="collapse-button collapse-left" title={props.t("layout.collapsePanel")} onClick={() => props.setCollapsed(true)}>
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      <NumberField label={props.t("setup.threads")} min={1} value={props.threads} onChange={props.setThreads} />
      <NumberField label={props.t("setup.rampUp")} min={0} value={props.rampUpSeconds} onChange={props.setRampUpSeconds} />
      <NumberField label={props.t("setup.loops")} min={1} value={props.loops} onChange={props.setLoops} />
      <NumberField label={props.t("setup.timeout")} min={1} value={props.requestTimeoutMs} onChange={props.setRequestTimeoutMs} />

      <div className="toggle-row">
        <span>{props.t("setup.dryRun")}</span>
        <input type="checkbox" />
      </div>

      <section className="setup-summary">
        <div className="trace-heading">{props.t("setup.planSummary")}</div>
        <div className="setup-summary-grid">
          <span>{props.t("setup.totalRequests")}</span>
          <strong>{totalRequests}</strong>
          <span>{props.t("setup.threadLoad")}</span>
          <strong>{props.threads} × {props.loops}</strong>
          <span>{props.t("setup.rampProfile")}</span>
          <strong>{rampRate}</strong>
          <span>{props.t("setup.userProfiles")}</span>
          <strong>{props.usersCount}</strong>
          <span>{props.t("setup.timeoutBudget")}</span>
          <strong>{props.requestTimeoutMs}ms</strong>
        </div>
        <div className="setup-url">
          <span>URL</span>
          <strong>{props.requestURL || "-"}</strong>
        </div>
        <p>{props.t("setup.readyPlan")}</p>
      </section>
    </aside>
  );
}
