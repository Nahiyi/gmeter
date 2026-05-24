import type { I18nKey } from "../i18n";
import type { ExecutionConfig, WorkbenchConfig, WorkbenchSelection } from "../workbenchPlan";
import { PlanNavigator } from "./plan/PlanNavigator";

export function RunSetupPanel(props: {
  bodyBytes: number;
  execution: ExecutionConfig;
  groupCount: number;
  isCollapsed: boolean;
  itemCount: number;
  onAddGroup: () => void;
  onAddItem: (groupID: string) => void;
  onDeleteGroup: (groupID: string) => void;
  onDeleteItem: (groupID: string, itemID: string) => void;
  onSelectGroup: (groupID: string) => void;
  onSelectItem: (groupID: string, itemID: string) => void;
  requestHeaderCount: number;
  requestMethod: string;
  requestURL: string;
  selection: WorkbenchSelection;
  selectedName: string;
  selectedKind: "group" | "item";
  setCollapsed: (value: boolean) => void;
  status: string;
  t: (key: I18nKey) => string;
  userHeaderCount: number;
  usersCount: number;
  workspace: WorkbenchConfig;
}) {
  const totalRequests = props.execution.threads * props.execution.loops * (props.selectedKind === "group" ? Math.max(props.itemCount, 1) : 1);
  const rampRate = props.execution.rampUpSeconds > 0
    ? `${(props.execution.threads / props.execution.rampUpSeconds).toFixed(1)}/s`
    : props.t("setup.instantRamp");
  const userCoverage = props.usersCount === 0
    ? props.t("setup.sharedOnly")
    : props.usersCount >= props.execution.threads
      ? props.t("setup.covered")
      : `${props.t("setup.missingUsers")} ${props.usersCount}/${props.execution.threads}`;

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

      <div className="setup-panel-body">
        <PlanNavigator
          onAddGroup={props.onAddGroup}
          onAddItem={props.onAddItem}
          onDeleteGroup={props.onDeleteGroup}
          onDeleteItem={props.onDeleteItem}
          onSelectGroup={props.onSelectGroup}
          onSelectItem={props.onSelectItem}
          selection={props.selection}
          t={props.t}
          workspace={props.workspace}
        />

        <section className="setup-summary">
          <div className="trace-heading">{props.t("setup.planSummary")}</div>
          <div className="setup-summary-body">
            <div className="setup-summary-grid">
              <span>{props.t("plan.selectedTarget")}</span>
              <strong>{props.selectedName}</strong>
              <span>{props.t("setup.mode")}</span>
              <strong>{props.execution.dryRun ? props.t("setup.modeDryRun") : props.t("setup.modeLoad")}</strong>
              <span>{props.t("setup.totalRequests")}</span>
              <strong>{totalRequests}</strong>
              <span>{props.t("setup.threadLoad")}</span>
              <strong>{props.execution.threads} × {props.execution.loops}</strong>
              <span>{props.t("setup.rampProfile")}</span>
              <strong>{rampRate}</strong>
              <span>{props.t("setup.userProfiles")}</span>
              <strong>{props.usersCount}</strong>
              <span>{props.t("setup.timeoutBudget")}</span>
              <strong>{props.execution.requestTimeoutMs}ms</strong>
              <span>{props.t("setup.userCoverage")}</span>
              <strong>{userCoverage}</strong>
            </div>
            <div className="setup-summary-grid setup-detail-grid">
              <span>{props.t("plan.groups")}</span>
              <strong>{props.groupCount}</strong>
              <span>{props.t("plan.items")}</span>
              <strong>{props.itemCount}</strong>
              <span>{props.t("setup.requestShape")}</span>
              <strong>{props.requestMethod}</strong>
              <span>{props.t("setup.sharedHeaders")}</span>
              <strong>{props.requestHeaderCount}</strong>
              <span>{props.t("setup.userHeaders")}</span>
              <strong>{props.userHeaderCount}</strong>
              <span>{props.t("setup.bodySize")}</span>
              <strong>{props.bodyBytes} B</strong>
            </div>
            <div className="setup-url">
              <span>URL</span>
              <strong>{props.requestURL || "-"}</strong>
            </div>
            <p>{props.t("setup.readyPlan")}</p>
          </div>
        </section>
      </div>
    </aside>
  );
}
