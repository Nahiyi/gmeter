import { useState } from "react";
import type { I18nKey } from "../../i18n";
import type { WorkbenchConfig, WorkbenchSelection } from "../../workbenchPlan";

export function PlanNavigator(props: {
  onAddGroup: () => void;
  onAddItem: (groupID: string) => void;
  onDeleteGroup: (groupID: string) => void;
  onDeleteItem: (groupID: string, itemID: string) => void;
  onSelectGroup: (groupID: string) => void;
  onSelectItem: (groupID: string, itemID: string) => void;
  selection: WorkbenchSelection;
  t: (key: I18nKey) => string;
  workspace: WorkbenchConfig;
}) {
  const [collapsedGroupIDs, setCollapsedGroupIDs] = useState<Set<string>>(() => new Set());

  function toggleGroupCollapsed(groupID: string) {
    setCollapsedGroupIDs((current) => {
      const next = new Set(current);
      if (next.has(groupID)) {
        next.delete(groupID);
      } else {
        next.add(groupID);
      }
      return next;
    });
  }

  return (
    <section className="plan-navigator">
      <div className="subheading">
        <span>{props.t("plan.navigator")}</span>
        <button type="button" onClick={props.onAddGroup}>{props.t("plan.addGroup")}</button>
      </div>

      <div className="plan-tree" role="tree">
        {props.workspace.groups.map((group) => {
          const groupActive = props.selection.type === "group" && props.selection.groupId === group.id;
          const canDeleteGroup = props.workspace.groups.length > 1;
          const groupCollapsed = collapsedGroupIDs.has(group.id);
          return (
            <div className="plan-group" key={group.id}>
              <div className="plan-node-row group-row">
                <button
                  type="button"
                  className={`plan-node group-node ${groupActive ? "active" : ""}`}
                  onClick={() => props.onSelectGroup(group.id)}
                >
                  <span className="node-icon folder-icon" aria-hidden="true" />
                  <strong>{group.name}</strong>
                  <small>{group.items.length}</small>
                </button>
                <button
                  type="button"
                  aria-expanded={!collapsedGroupIDs.has(group.id)}
                  className={`plan-collapse-button ${groupCollapsed ? "collapsed" : ""}`}
                  onClick={() => toggleGroupCollapsed(group.id)}
                  title={groupCollapsed ? props.t("layout.expandPanel") : props.t("layout.collapsePanel")}
                >
                  <span className="collapse-chevron" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="plan-delete-button"
                  disabled={!canDeleteGroup}
                  onClick={() => props.onDeleteGroup(group.id)}
                  title={canDeleteGroup ? props.t("plan.deleteGroup") : props.t("plan.keepOneGroup")}
                >
                  <span className="trash-icon" aria-hidden="true" />
                </button>
              </div>

              {!collapsedGroupIDs.has(group.id) ? (
                <div className="plan-items">
                  {group.items.map((item) => {
                    const itemActive = props.selection.type === "item" && props.selection.groupId === group.id && props.selection.itemId === item.id;
                    return (
                      <div className="plan-node-row" key={item.id}>
                        <button
                          type="button"
                          className={`plan-node item-node ${itemActive ? "active" : ""}`}
                          onClick={() => props.onSelectItem(group.id, item.id)}
                        >
                          <span className="node-icon item-icon" aria-hidden="true" />
                          <strong>{item.name}</strong>
                        </button>
                        <button
                          type="button"
                          className="plan-delete-button"
                          onClick={() => props.onDeleteItem(group.id, item.id)}
                          title={props.t("plan.deleteItem")}
                        >
                          <span className="trash-icon" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                  <button type="button" className="plan-add-item" onClick={() => props.onAddItem(group.id)}>
                    {props.t("plan.addItem")}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
