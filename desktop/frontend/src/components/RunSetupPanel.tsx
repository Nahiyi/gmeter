import type { I18nKey } from "../i18n";
import { NumberField } from "./NumberField";

export function RunSetupPanel(props: {
  loops: number;
  rampUpSeconds: number;
  requestTimeoutMs: number;
  setLoops: (value: number) => void;
  setRampUpSeconds: (value: number) => void;
  setRequestTimeoutMs: (value: number) => void;
  setThreads: (value: number) => void;
  status: string;
  t: (key: I18nKey) => string;
  threads: number;
}) {
  return (
    <aside className="panel setup-panel" aria-label="Run setup">
      <div className="panel-heading">
        <h1>{props.t("nav.runSetup")}</h1>
        <span className="status idle">{props.status}</span>
      </div>

      <NumberField label={props.t("setup.threads")} min={1} value={props.threads} onChange={props.setThreads} />
      <NumberField label={props.t("setup.rampUp")} min={0} value={props.rampUpSeconds} onChange={props.setRampUpSeconds} />
      <NumberField label={props.t("setup.loops")} min={1} value={props.loops} onChange={props.setLoops} />
      <NumberField label={props.t("setup.timeout")} min={1} value={props.requestTimeoutMs} onChange={props.setRequestTimeoutMs} />

      <div className="toggle-row">
        <span>{props.t("setup.dryRun")}</span>
        <input type="checkbox" />
      </div>
    </aside>
  );
}
