import type { I18nKey } from "../../i18n";
import type { ExecutionConfig, WorkbenchGroup } from "../../workbenchPlan";
import { ExecutionEditor } from "./ExecutionEditor";

export function GroupEditor(props: {
  execution: ExecutionConfig;
  group: WorkbenchGroup;
  onAddItem: () => void;
  onExecutionChange: (patch: Partial<ExecutionConfig>) => void;
  onNameChange: (name: string) => void;
  onSelectItem: (itemID: string) => void;
  t: (key: I18nKey) => string;
  workspaceText: string;
}) {
  return (
    <div className="request-form group-editor">
      <section className="target-card">
        <div className="target-title-row">
          <label>
            {props.t("plan.groupName")}
            <input value={props.group.name} onChange={(event) => props.onNameChange(event.target.value)} />
          </label>
          <span>{props.t("plan.serialGroup")}</span>
        </div>
        <ExecutionEditor execution={props.execution} onChange={props.onExecutionChange} t={props.t} />
      </section>

      <section className="group-items-panel">
        <div className="subheading">
          <span>{props.t("plan.groupItems")}</span>
          <button type="button" onClick={props.onAddItem}>{props.t("plan.addItem")}</button>
        </div>
        <div className="group-items-table">
          {props.group.items.map((item, index) => (
            <button type="button" className="group-item-row" key={item.id} onClick={() => props.onSelectItem(item.id)}>
              <span>{index + 1}</span>
              <strong>{item.name}</strong>
              <small>{item.request.method || "GET"}</small>
              <em>{item.request.url || props.t("plan.emptyUrl")}</em>
            </button>
          ))}
          {props.group.items.length === 0 ? (
            <div className="empty-panel">{props.t("plan.emptyGroup")}</div>
          ) : null}
        </div>
      </section>

      <label className="json-preview">
        {props.t("request.jsonPreview")}
        <textarea spellCheck="false" readOnly value={props.workspaceText} />
      </label>
    </div>
  );
}
