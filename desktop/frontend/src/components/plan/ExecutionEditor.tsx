import type { I18nKey } from "../../i18n";
import type { ExecutionConfig } from "../../workbenchPlan";
import { NumberField } from "../NumberField";

export function ExecutionEditor(props: {
  execution: ExecutionConfig;
  onChange: (patch: Partial<ExecutionConfig>) => void;
  t: (key: I18nKey) => string;
}) {
  return (
    <section className="execution-editor">
      <div className="subheading">{props.t("plan.execution")}</div>
      <div className="execution-grid">
        <NumberField label={props.t("setup.threads")} min={1} value={props.execution.threads} onChange={(threads) => props.onChange({ threads })} />
        <NumberField label={props.t("setup.rampUp")} min={0} value={props.execution.rampUpSeconds} onChange={(rampUpSeconds) => props.onChange({ rampUpSeconds })} />
        <NumberField label={props.t("setup.loops")} min={1} value={props.execution.loops} onChange={(loops) => props.onChange({ loops })} />
        <NumberField label={props.t("setup.timeout")} min={1} value={props.execution.requestTimeoutMs} onChange={(requestTimeoutMs) => props.onChange({ requestTimeoutMs })} />
      </div>
      <div className="toggle-row compact-toggle">
        <span>{props.t("setup.dryRun")}</span>
        <input type="checkbox" checked={props.execution.dryRun} onChange={(event) => props.onChange({ dryRun: event.target.checked })} />
      </div>
    </section>
  );
}
