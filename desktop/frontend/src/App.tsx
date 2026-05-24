import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { GetRunSnapshot, StartRun, StopRun, ValidatePlan } from "../wailsjs/go/desktop/App";
import { desktop, engine } from "../wailsjs/go/models";
import { EventsOn, WindowSetDarkTheme, WindowSetLightTheme, WindowSetSystemDefaultTheme } from "../wailsjs/runtime/runtime";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ConfigEditor } from "./components/config/ConfigEditor";
import { ExecutionEditor } from "./components/plan/ExecutionEditor";
import { GroupEditor } from "./components/plan/GroupEditor";
import { ResultsWorkbench } from "./components/results/ResultsWorkbench";
import { RunSetupPanel } from "./components/RunSetupPanel";
import { RunSummaryPanel } from "./components/RunSummaryPanel";
import { Titlebar } from "./components/Titlebar";
import { getSavedLocale, I18nKey, Locale, saveLocale, translate } from "./i18n";
import { buildResultStats, LatencyRangeFilter, queryTraces, TraceFilter, TraceSort } from "./resultStats";
import { applyThemePreference, getSavedThemePreference, saveThemePreference, ThemePreference } from "./theme";
import type { HeaderRow, RequestConfig, UserConfig, UserRow, WorkbenchView } from "./types/config";
import { createID, headersFromRows, rowsFromHeaders } from "./utils/configRows";
import { statusKeyFromRun } from "./utils/status";
import {
  createDefaultWorkbenchConfig,
  createWorkbenchGroup,
  createWorkbenchItem,
  ExecutionConfig,
  findWorkbenchGroup,
  findWorkbenchItem,
  getInitialWorkbenchSelection,
  normalizeWorkbenchConfig,
  removeWorkbenchGroup,
  removeWorkbenchItem,
  resolveExecutionConfig,
  updateWorkbenchGroup,
  updateWorkbenchItem,
  WorkbenchConfig,
  WorkbenchGroup,
  WorkbenchItem,
  WorkbenchSelection
} from "./workbenchPlan";

type RunEvent = {
  trace?: desktop.TraceDTO;
};

type ActiveRunTarget = {
  groupName: string;
  itemName: string;
};

type WorkbenchState = {
  workspace: WorkbenchConfig;
  selection: WorkbenchSelection;
};

type ConfirmDeleteRequest =
  | { type: "group"; groupId: string; name: string; previewItems: string[]; hiddenItemCount: number }
  | { type: "item"; groupId: string; itemId: string; name: string };

function createInitialWorkbenchState(): WorkbenchState {
  const workspace = createDefaultWorkbenchConfig();
  return {
    workspace,
    selection: getInitialWorkbenchSelection(workspace)
  };
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRunTargetRef = useRef<ActiveRunTarget | null>(null);
  const groupRunCanceledRef = useRef(false);
  const [workbenchState, setWorkbenchState] = useState<WorkbenchState>(createInitialWorkbenchState);
  const [requestHeaders, setRequestHeaders] = useState<HeaderRow[]>(() => rowsFromHeaders({}));
  const [users, setUsers] = useState<UserRow[]>([]);
  const [snapshot, setSnapshot] = useState<desktop.RunSnapshot | null>(null);
  const [runTraces, setRunTraces] = useState<desktop.TraceDTO[]>([]);
  const [statusKey, setStatusKey] = useState<I18nKey>("status.idle");
  const [locale, setLocale] = useState<Locale>(getSavedLocale);
  const [themePreference, setThemePreference] = useState<ThemePreference>(getSavedThemePreference);
  const [selectedTrace, setSelectedTrace] = useState<desktop.TraceDTO | null>(null);
  const [workbenchView, setWorkbenchView] = useState<WorkbenchView>("config");
  const [traceFilter, setTraceFilter] = useState<TraceFilter>("all");
  const [latencyRange, setLatencyRange] = useState<LatencyRangeFilter>("all");
  const [traceSearch, setTraceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [traceSort, setTraceSort] = useState<TraceSort>("latest");
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [isGroupRunning, setIsGroupRunning] = useState(false);
  const [confirmDeleteRequest, setConfirmDeleteRequest] = useState<ConfirmDeleteRequest | null>(null);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    translate(getSavedLocale(), "console.ready")
  ]);

  const t = (key: I18nKey) => translate(locale, key);
  const status = t(statusKey);
  const workspace = workbenchState.workspace;
  const selection = workbenchState.selection;
  const selectedGroup = useMemo<WorkbenchGroup>(
    () => findWorkbenchGroup(workspace, selection.groupId) ?? workspace.groups[0]!,
    [selection.groupId, workspace]
  );
  const selectedItem = useMemo<WorkbenchItem | undefined>(
    () => selection.type === "item" ? findWorkbenchItem(selectedGroup, selection.itemId) : undefined,
    [selectedGroup, selection]
  );
  const selectedKind = selectedItem ? "item" : "group";
  const selectedName = selectedItem?.name ?? selectedGroup.name;
  const effectiveExecution = useMemo(
    () => resolveExecutionConfig(workspace, selectedGroup, selectedItem),
    [selectedGroup, selectedItem, workspace]
  );

  useEffect(() => {
    function applyTheme() {
      applyThemePreference(themePreference);
      try {
        if (themePreference === "system") WindowSetSystemDefaultTheme();
        if (themePreference === "light") WindowSetLightTheme();
        if (themePreference === "dark") WindowSetDarkTheme();
      } catch {
        // Wails runtime is not available in plain frontend test/preview contexts.
      }
    }

    applyTheme();
    if (themePreference !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [themePreference]);

  useEffect(() => {
    function preventWheelZoom(event: WheelEvent) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    }
    function preventKeyboardZoom(event: KeyboardEvent) {
      const isZoomShortcut = event.ctrlKey && ["+", "=", "-", "_", "0"].includes(event.key);
      if (isZoomShortcut) {
        event.preventDefault();
      }
    }

    window.addEventListener("wheel", preventWheelZoom, { passive: false });
    window.addEventListener("keydown", preventKeyboardZoom);
    return () => {
      window.removeEventListener("wheel", preventWheelZoom);
      window.removeEventListener("keydown", preventKeyboardZoom);
    };
  }, []);

  useEffect(() => {
    GetRunSnapshot().then((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      setRunTraces(nextSnapshot.recentTraces ?? []);
    });
    const offSnapshot = EventsOn("gmeter:run:snapshot", (nextSnapshot: desktop.RunSnapshot) => {
      setSnapshot(nextSnapshot);
      setStatusKey(statusKeyFromRun(nextSnapshot.status));
    });
    const offEvent = EventsOn("gmeter:run:event", (event: RunEvent) => {
      if (event.trace) {
        const trace = event.trace;
        const activeTarget = activeRunTargetRef.current;
        const labelledTrace = activeTarget ? { ...trace, groupName: activeTarget.groupName, itemName: activeTarget.itemName } : trace;
        setRunTraces((current) => [labelledTrace, ...current].slice(0, 500));
        appendConsole(`${translate(getSavedLocale(), "trace.consolePrefix")} ${activeTarget ? `${activeTarget.itemName} ` : ""}T${trace.threadId} L${trace.loopIndex}: ${translate(getSavedLocale(), "trace.consoleHTTP")} ${trace.responseStatus} ${translate(getSavedLocale(), "trace.consoleIn")} ${trace.responseTimeMs}ms`);
      }
    });
    return () => {
      offSnapshot();
      offEvent();
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) {
      setRequestHeaders(rowsFromHeaders({}));
      setUsers([]);
      return;
    }
    setRequestHeaders(rowsFromHeaders(selectedItem.request.headers ?? {}));
    setUsers(rowsFromUserConfigs(selectedItem.users ?? []));
  }, [selectedItem?.id]);

  const configText = useMemo(() => JSON.stringify(workspace, null, 2), [workspace]);
  const summary = snapshot?.summary;
  const recentTraces = runTraces.length > 0 ? runTraces : snapshot?.recentTraces ?? [];
  const isRunning = snapshot?.status === "running" || isGroupRunning;
  const resultStats = useMemo(() => buildResultStats(recentTraces), [recentTraces]);
  const requestHeaderCount = useMemo(
    () => selectedItem ? requestHeaders.filter((header) => header.key.trim()).length : countGroupRequestHeaders(selectedGroup),
    [requestHeaders, selectedGroup, selectedItem]
  );
  const userHeaderCount = useMemo(
    () => selectedItem
      ? users.reduce((total, user) => total + user.headers.filter((header) => header.key.trim()).length, 0)
      : countGroupUserHeaders(selectedGroup),
    [selectedGroup, selectedItem, users]
  );
  const bodyBytes = useMemo(
    () => selectedItem ? new Blob([selectedItem.request.body ?? ""]).size : countGroupBodyBytes(selectedGroup),
    [selectedGroup, selectedItem]
  );
  const usersCount = selectedItem ? users.length : selectedGroup.items.reduce((total, item) => total + (item.users?.length ?? 0), 0);
  const itemCount = selectedKind === "group" ? selectedGroup.items.length : 1;
  const groupCount = workspace.groups.length;
  const requestMethod = selectedItem ? selectedItem.request.method : `${selectedGroup.items.length} items`;
  const requestURL = selectedItem ? selectedItem.request.url : "";
  const statusOptions = useMemo(() => {
    const statuses = new Set(recentTraces.map((trace) => String(trace.responseStatus || "ERR")));
    return Array.from(statuses).sort((a, b) => a.localeCompare(b));
  }, [recentTraces]);
  const filteredTraces = useMemo(
    () => queryTraces(recentTraces, { latencyRange, search: traceSearch, sort: traceSort, status: statusFilter, traceFilter }),
    [latencyRange, recentTraces, statusFilter, traceFilter, traceSearch, traceSort]
  );
  const deleteOverflowLabel = confirmDeleteRequest?.type === "group" && confirmDeleteRequest.hiddenItemCount > 0
    ? translate(locale, "plan.moreItems").replace("{count}", String(confirmDeleteRequest.hiddenItemCount))
    : undefined;

  const metrics = useMemo(
    () => {
      const summaryValues = buildMetricValues(summary, recentTraces);
      return [
        [t("summary.requests"), String(summaryValues.totalRequests)],
        [t("summary.success"), String(summaryValues.successCount)],
        [t("summary.failed"), String(summaryValues.failCount)],
        [t("summary.avg"), summaryValues.avgResponseTimeMs === null ? "-- ms" : `${summaryValues.avgResponseTimeMs.toFixed(1)} ms`],
        [t("summary.p90"), summaryValues.p90ResponseTimeMs === null ? "-- ms" : `${summaryValues.p90ResponseTimeMs} ms`],
        [t("summary.p99"), summaryValues.p99ResponseTimeMs === null ? "-- ms" : `${summaryValues.p99ResponseTimeMs} ms`]
      ];
    },
    [locale, recentTraces, summary]
  );

  function appendConsole(line: string) {
    setConsoleLines((current) => [line, ...current].slice(0, 10));
  }

  function updateWorkspace(updater: (workspace: WorkbenchConfig) => WorkbenchConfig) {
    setWorkbenchState((current) => ({
      ...current,
      workspace: updater(current.workspace)
    }));
  }

  function setSelection(selection: WorkbenchSelection) {
    setWorkbenchState((current) => ({
      ...current,
      selection
    }));
  }

  function patchSelectedGroup(patch: Partial<WorkbenchGroup>) {
    updateWorkspace((current) => updateWorkbenchGroup(current, selectedGroup.id, (group) => ({ ...group, ...patch })));
  }

  function patchSelectedGroupExecution(patch: Partial<ExecutionConfig>) {
    updateWorkspace((current) => updateWorkbenchGroup(current, selectedGroup.id, (group) => ({
      ...group,
      execution: { ...group.execution, ...patch }
    })));
  }

  function patchSelectedItem(patch: Partial<WorkbenchItem>) {
    if (!selectedItem) return;
    updateWorkspace((current) => updateWorkbenchItem(current, selectedGroup.id, selectedItem.id, (item) => ({ ...item, ...patch })));
  }

  function patchSelectedItemRequest(patch: Partial<RequestConfig>) {
    if (!selectedItem) return;
    patchSelectedItem({
      request: {
        ...selectedItem.request,
        ...patch
      }
    });
  }

  function patchSelectedItemExecution(patch: Partial<ExecutionConfig>) {
    if (!selectedItem) return;
    updateWorkspace((current) => updateWorkbenchItem(current, selectedGroup.id, selectedItem.id, (item) => ({
      ...item,
      execution: { ...item.execution, ...patch }
    })));
  }

  function handleAddGroup() {
    const group = createWorkbenchGroup(createID, `${t("plan.targetGroup")} ${workspace.groups.length + 1}`);
    setWorkbenchState((current) => ({
      workspace: {
        ...current.workspace,
        groups: [...current.workspace.groups, group]
      },
      selection: { type: "group", groupId: group.id }
    }));
  }

  function handleAddItem(groupID: string) {
    const group = findWorkbenchGroup(workspace, groupID) ?? selectedGroup;
    const item = createWorkbenchItem(createID, `${t("plan.targetItem")} ${group.items.length + 1}`);
    setWorkbenchState((current) => ({
      workspace: updateWorkbenchGroup(current.workspace, groupID, (targetGroup) => ({
        ...targetGroup,
        items: [...targetGroup.items, item]
      })),
      selection: { type: "item", groupId: groupID, itemId: item.id }
    }));
  }

  function handleDeleteGroup(groupID: string) {
    const group = findWorkbenchGroup(workspace, groupID);
    if (!group || workspace.groups.length <= 1) return;
    setConfirmDeleteRequest({
      type: "group",
      groupId: groupID,
      name: group.name,
      previewItems: group.items.slice(0, 5).map((item) => item.name),
      hiddenItemCount: Math.max(0, group.items.length - 5)
    });
  }

  function handleConfirmDelete() {
    if (!confirmDeleteRequest) return;

    if (confirmDeleteRequest.type === "group") {
      confirmDeleteGroup(confirmDeleteRequest.groupId);
    } else {
      confirmDeleteItem(confirmDeleteRequest.groupId, confirmDeleteRequest.itemId);
    }
    setConfirmDeleteRequest(null);
  }

  function confirmDeleteGroup(groupID: string) {
    setWorkbenchState((current) => {
      const nextWorkspace = removeWorkbenchGroup(current.workspace, groupID);
      return {
        workspace: nextWorkspace,
        selection: current.selection.groupId === groupID ? getInitialWorkbenchSelection(nextWorkspace) : current.selection
      };
    });
  }

  function handleDeleteItem(groupID: string, itemID: string) {
    const group = findWorkbenchGroup(workspace, groupID);
    const item = findWorkbenchItem(group, itemID);
    if (!group || !item) return;
    setConfirmDeleteRequest({ type: "item", groupId: groupID, itemId: itemID, name: item.name });
  }

  function confirmDeleteItem(groupID: string, itemID: string) {
    setWorkbenchState((current) => {
      const nextWorkspace = removeWorkbenchItem(current.workspace, groupID, itemID);
      const nextGroup = findWorkbenchGroup(nextWorkspace, groupID);
      const nextSelection = current.selection.type === "item" && current.selection.groupId === groupID && current.selection.itemId === itemID
        ? nextGroup?.items[0]
          ? { type: "item" as const, groupId: groupID, itemId: nextGroup.items[0].id }
          : { type: "group" as const, groupId: groupID }
        : current.selection;
      return {
        workspace: nextWorkspace,
        selection: nextSelection
      };
    });
  }

  function buildPlan(item: WorkbenchItem): engine.TestPlan {
    return new engine.TestPlan({
      Name: item.name,
      Request: new engine.RequestSpec({
        Method: item.request.method,
        URL: item.request.url,
        Headers: item.request.headers ?? {},
        Body: item.request.body ?? ""
      }),
      Users: (item.users ?? []).map((user) => new engine.UserSpec({
        Headers: user.headers ?? {}
      }))
    });
  }

  function runOptions(execution: ExecutionConfig) {
    return {
      threads: execution.threads,
      loops: execution.loops,
      rampUpSeconds: execution.rampUpSeconds,
      requestTimeoutMs: execution.requestTimeoutMs,
      maxDurationSec: 0,
      dryRun: execution.dryRun
    };
  }

  async function startItemRun(group: WorkbenchGroup, item: WorkbenchItem, clearTraces: boolean, waitForCompletion: boolean) {
    const execution = resolveExecutionConfig(workspace, group, item);
    const plan = buildPlan(item);
    const options = runOptions(execution);
    const validation = await ValidatePlan(plan, options);
    if (validation) {
      setStatusKey("status.invalid");
      appendConsole(`${item.name}: ${t("console.validationFailed")}: ${validation}`);
      return "invalid";
    }

    if (clearTraces) {
      setRunTraces([]);
      setSelectedTrace(null);
    }
    setStatusKey("status.running");
    activeRunTargetRef.current = { groupName: group.name, itemName: item.name };
    appendConsole(`${t("console.starting")} ${group.name} / ${item.name}`);
    const runID = await StartRun(plan, options);

    if (execution.dryRun) {
      setStatusKey("status.complete");
      appendConsole(`${item.name}: ${t("console.validationPassed")}`);
      return "validated";
    }

    setWorkbenchView("results");
    appendConsole(`${t("console.runStarted")}: ${runID}`);
    if (waitForCompletion) {
      const finished = await waitForRunCompletion(runID);
      return finished?.status === "canceled" ? "canceled" : "completed";
    }
    return "started";
  }

  async function handleRun() {
    if (isRunning) return;
    try {
      if (selectedItem) {
        await startItemRun(selectedGroup, selectedItem, true, false);
        return;
      }
      await handleRunGroup(selectedGroup);
    } catch (error) {
      activeRunTargetRef.current = null;
      setStatusKey("status.failed");
      appendConsole(`${t("console.runFailed")}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleRunGroup(group: WorkbenchGroup) {
    if (group.items.length === 0) {
      setStatusKey("status.invalid");
      appendConsole(t("plan.emptyGroup"));
      return;
    }

    setWorkbenchView("results");
    setRunTraces([]);
    setSelectedTrace(null);
    setIsGroupRunning(true);
    groupRunCanceledRef.current = false;
    appendConsole(`${t("console.starting")} ${group.name} (${t("plan.serialGroup")})`);

    try {
      for (const item of group.items) {
        if (groupRunCanceledRef.current) break;
        const result = await startItemRun(group, item, false, true);
        if (result === "invalid" || result === "canceled") break;
      }
      if (groupRunCanceledRef.current) {
        setStatusKey("status.canceled");
      } else {
        setStatusKey("status.complete");
      }
    } finally {
      activeRunTargetRef.current = null;
      setIsGroupRunning(false);
    }
  }

  async function waitForRunCompletion(runID: string) {
    while (!groupRunCanceledRef.current) {
      const nextSnapshot = await GetRunSnapshot();
      setSnapshot(nextSnapshot);
      if (nextSnapshot.runId === runID && nextSnapshot.status !== "running") {
        return nextSnapshot;
      }
      await delay(150);
    }
    return null;
  }

  async function handleStop() {
    groupRunCanceledRef.current = true;
    try {
      if (snapshot?.status === "running") {
        await StopRun();
      }
      setIsGroupRunning(false);
      appendConsole(t("console.stopRequested"));
    } catch (error) {
      appendConsole(`${t("console.stopFailed")}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function handleSave() {
    const blob = new Blob([configText], { type: "application/json" });
    const objectURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectURL;
    link.download = "gmeter-workspace.json";
    link.click();
    URL.revokeObjectURL(objectURL);
    appendConsole(t("console.exported"));
  }

  function handleOpenClick() {
    fileInputRef.current?.click();
  }

  function handleOpenFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const nextWorkspace = normalizeWorkbenchConfig(JSON.parse(String(reader.result ?? "")), {
          defaultExecution: workspace.defaultExecution
        });
        setWorkbenchState({
          workspace: nextWorkspace,
          selection: getInitialWorkbenchSelection(nextWorkspace)
        });
        appendConsole(`${t("console.loaded")}: ${file.name}`);
      } catch (error) {
        appendConsole(`${t("console.openFailed")}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const itemHeader = selectedItem ? (
    <section className="target-card">
      <label>
        {t("plan.itemName")}
        <input value={selectedItem.name} onChange={(event) => patchSelectedItem({ name: event.target.value })} />
      </label>
      <ExecutionEditor execution={effectiveExecution} onChange={patchSelectedItemExecution} t={t} />
    </section>
  ) : null;

  return (
    <main className="app-shell">
      <Titlebar
        fileInputRef={fileInputRef}
        isRunning={isRunning}
        locale={locale}
        onLocaleChange={(nextLocale) => {
          setLocale(nextLocale);
          saveLocale(nextLocale);
        }}
        onOpenClick={handleOpenClick}
        onOpenFile={handleOpenFile}
        onRun={handleRun}
        onSave={handleSave}
        onStop={handleStop}
        onThemePreferenceChange={(nextTheme) => {
          setThemePreference(nextTheme);
          saveThemePreference(nextTheme);
        }}
        t={t}
        themePreference={themePreference}
      />

      <section className={`workspace ${isSetupCollapsed ? "setup-collapsed" : ""} ${isSummaryCollapsed ? "summary-collapsed" : ""}`}>
        <RunSetupPanel
          bodyBytes={bodyBytes}
          execution={effectiveExecution}
          groupCount={groupCount}
          isCollapsed={isSetupCollapsed}
          itemCount={itemCount}
          onAddGroup={handleAddGroup}
          onAddItem={handleAddItem}
          onDeleteGroup={handleDeleteGroup}
          onDeleteItem={handleDeleteItem}
          onSelectGroup={(groupId) => setSelection({ type: "group", groupId })}
          onSelectItem={(groupId, itemId) => setSelection({ type: "item", groupId, itemId })}
          requestHeaderCount={requestHeaderCount}
          requestMethod={requestMethod}
          requestURL={requestURL}
          selection={selection}
          selectedKind={selectedKind}
          selectedName={selectedName}
          setCollapsed={setIsSetupCollapsed}
          status={status}
          t={t}
          userHeaderCount={userHeaderCount}
          usersCount={usersCount}
          workspace={workspace}
        />

        <section className="panel editor-panel" aria-label="Request configuration">
          <div className="panel-heading workbench-heading">
            <h2>{workbenchView === "config" ? selectedName : t("results.workbench")}</h2>
            <span className="workbench-mode">{workbenchView === "config" ? (selectedKind === "group" ? t("plan.targetGroup") : t("plan.targetItem")) : t("results.mode")}</span>
            <div className="segmented-control" role="tablist">
              <button type="button" className={workbenchView === "config" ? "active" : ""} onClick={() => setWorkbenchView("config")}>{t("view.config")}</button>
              <button type="button" className={workbenchView === "results" ? "active" : ""} onClick={() => setWorkbenchView("results")}>{t("view.results")}</button>
            </div>
          </div>

          {workbenchView === "config" ? (
            selectedItem ? (
              <ConfigEditor
                body={selectedItem.request.body ?? ""}
                configText={configText}
                header={itemHeader}
                method={selectedItem.request.method || "GET"}
                requestHeaders={requestHeaders}
                setBody={(body) => patchSelectedItemRequest({ body })}
                setMethod={(method) => patchSelectedItemRequest({ method })}
                setRequestHeaders={(rows) => {
                  setRequestHeaders(rows);
                  patchSelectedItemRequest({ headers: headersFromRows(rows) });
                }}
                setURL={(url) => patchSelectedItemRequest({ url })}
                setUsers={(nextUsers) => {
                  setUsers(nextUsers);
                  patchSelectedItem({ users: userConfigsFromRows(nextUsers) });
                }}
                t={t}
                url={selectedItem.request.url}
                users={users}
              />
            ) : (
              <GroupEditor
                execution={effectiveExecution}
                group={selectedGroup}
                onAddItem={() => handleAddItem(selectedGroup.id)}
                onExecutionChange={patchSelectedGroupExecution}
                onNameChange={(name) => patchSelectedGroup({ name })}
                onSelectItem={(itemID) => setSelection({ type: "item", groupId: selectedGroup.id, itemId: itemID })}
                t={t}
                workspaceText={configText}
              />
            )
          ) : (
            <ResultsWorkbench
              latencyRange={latencyRange}
              filteredTraces={filteredTraces}
              recentTraces={recentTraces}
              resultStats={resultStats}
              selectedTrace={selectedTrace}
              setLatencyRange={setLatencyRange}
              setSelectedTrace={setSelectedTrace}
              setStatusFilter={setStatusFilter}
              setTraceFilter={setTraceFilter}
              setTraceSearch={setTraceSearch}
              setTraceSort={setTraceSort}
              statusFilter={statusFilter}
              statusOptions={statusOptions}
              t={t}
              traceFilter={traceFilter}
              traceSearch={traceSearch}
              traceSort={traceSort}
            />
          )}
        </section>

        <RunSummaryPanel
          consoleLines={consoleLines}
          isCollapsed={isSummaryCollapsed}
          metrics={metrics}
          recentTraces={recentTraces}
          selectedTrace={selectedTrace}
          setCollapsed={setIsSummaryCollapsed}
          setSelectedTrace={setSelectedTrace}
          status={status}
          t={t}
        />
      </section>

      <ConfirmDialog
        cancelLabel={t("command.cancel")}
        confirmLabel={t("command.delete")}
        isOpen={confirmDeleteRequest !== null}
        message={confirmDeleteRequest?.type === "group" ? t("plan.confirmDeleteGroup") : t("plan.confirmDeleteItem")}
        onCancel={() => setConfirmDeleteRequest(null)}
        onConfirm={handleConfirmDelete}
        overflowLabel={deleteOverflowLabel}
        previewItems={confirmDeleteRequest?.type === "group" ? confirmDeleteRequest.previewItems : undefined}
        targetName={confirmDeleteRequest?.name ?? ""}
        title={t("plan.deleteTitle")}
      />
    </main>
  );
}

function rowsFromUserConfigs(users: UserConfig[]): UserRow[] {
  return users.map((user) => ({
    id: createID(),
    headers: rowsFromHeaders(user.headers ?? {})
  }));
}

function userConfigsFromRows(users: UserRow[]): UserConfig[] {
  return users.map((user) => ({
    headers: headersFromRows(user.headers)
  }));
}

function countGroupRequestHeaders(group: WorkbenchGroup) {
  return group.items.reduce((total, item) => total + Object.keys(item.request.headers ?? {}).length, 0);
}

function countGroupUserHeaders(group: WorkbenchGroup) {
  return group.items.reduce(
    (total, item) => total + (item.users ?? []).reduce((userTotal, user) => userTotal + Object.keys(user.headers ?? {}).length, 0),
    0
  );
}

function countGroupBodyBytes(group: WorkbenchGroup) {
  return group.items.reduce((total, item) => total + new Blob([item.request.body ?? ""]).size, 0);
}

function buildMetricValues(summary: desktop.SummaryDTO | undefined, traces: desktop.TraceDTO[]) {
  if (traces.length > 0) {
    const latencies = traces.map((trace) => Number(trace.responseTimeMs)).sort((a, b) => a - b);
    const successCount = traces.filter((trace) => trace.success).length;
    const total = traces.length;
    return {
      totalRequests: total,
      successCount,
      failCount: total - successCount,
      avgResponseTimeMs: latencies.reduce((sum, value) => sum + value, 0) / total,
      p90ResponseTimeMs: percentile(latencies, 0.9),
      p99ResponseTimeMs: percentile(latencies, 0.99)
    };
  }

  return {
    totalRequests: summary?.totalRequests ?? 0,
    successCount: summary?.successCount ?? 0,
    failCount: summary?.failCount ?? 0,
    avgResponseTimeMs: summary ? summary.avgResponseTimeMs : null,
    p90ResponseTimeMs: summary ? summary.p90ResponseTimeMs : null,
    p99ResponseTimeMs: summary ? summary.p99ResponseTimeMs : null
  };
}

function percentile(sortedValues: number[], percentileRank: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil(sortedValues.length * percentileRank) - 1);
  return sortedValues[index];
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default App;
