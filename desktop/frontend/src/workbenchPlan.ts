import type { RequestConfig, UserConfig } from "./types/config.js";
import { createID } from "./utils/configRows.js";

export type ExecutionConfig = {
  threads: number;
  rampUpSeconds: number;
  loops: number;
  requestTimeoutMs: number;
  dryRun: boolean;
};

export type ExecutionOverrides = Partial<ExecutionConfig>;

export type WorkbenchItem = {
  id: string;
  name: string;
  execution?: ExecutionOverrides;
  request: RequestConfig;
  users?: UserConfig[];
};

export type WorkbenchGroup = {
  id: string;
  name: string;
  execution?: ExecutionOverrides;
  items: WorkbenchItem[];
  groups?: WorkbenchGroup[];
};

export type WorkbenchConfig = {
  version: 2;
  name: string;
  defaultExecution: ExecutionConfig;
  groups: WorkbenchGroup[];
};

export type WorkbenchSelection =
  | { type: "group"; groupId: string }
  | { type: "item"; groupId: string; itemId: string };

type NormalizeOptions = {
  defaultExecution?: ExecutionConfig;
  idFactory?: () => string;
};

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  threads: 10,
  rampUpSeconds: 0,
  loops: 1,
  requestTimeoutMs: 5000,
  dryRun: false
};

const DEFAULT_REQUEST: RequestConfig = {
  url: "https://example.com/api",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: "{}"
};

export function createDefaultWorkbenchConfig(options: NormalizeOptions = {}): WorkbenchConfig {
  const idFactory = options.idFactory ?? createID;
  return {
    version: 2,
    name: "GMeter Workspace",
    defaultExecution: cloneExecution(options.defaultExecution ?? DEFAULT_EXECUTION_CONFIG),
    groups: [
      {
        id: idFactory(),
        name: "Default Group",
        execution: {},
        items: [
          {
            id: idFactory(),
            name: "Desktop Run",
            execution: {},
            request: cloneRequest(DEFAULT_REQUEST),
            users: []
          }
        ]
      }
    ]
  };
}

export function createWorkbenchGroup(idFactory: () => string = createID, name = "New Group"): WorkbenchGroup {
  return {
    id: idFactory(),
    name,
    execution: {},
    items: []
  };
}

export function createWorkbenchItem(idFactory: () => string = createID, name = "New Request"): WorkbenchItem {
  return {
    id: idFactory(),
    name,
    execution: {},
    request: {
      method: "GET",
      url: "",
      headers: {},
      body: ""
    },
    users: []
  };
}

export function normalizeWorkbenchConfig(input: unknown, options: NormalizeOptions = {}): WorkbenchConfig {
  const idFactory = options.idFactory ?? createID;
  const fallbackExecution = cloneExecution(options.defaultExecution ?? DEFAULT_EXECUTION_CONFIG);

  if (isWorkbenchConfigLike(input)) {
    const groups = input.groups.map((group) => normalizeGroup(group, idFactory));
    return {
      version: 2,
      name: readString(input.name, "GMeter Workspace"),
      defaultExecution: normalizeExecution(input.defaultExecution, fallbackExecution),
      groups: groups.length > 0 ? groups : createDefaultWorkbenchConfig({ defaultExecution: fallbackExecution, idFactory }).groups
    };
  }

  if (isLegacyConfigLike(input)) {
    return {
      version: 2,
      name: "GMeter Workspace",
      defaultExecution: fallbackExecution,
      groups: [
        {
          id: idFactory(),
          name: "Default Group",
          execution: {},
          items: [
            {
              id: idFactory(),
              name: "Desktop Run",
              execution: {},
              request: normalizeRequest(input.request),
              users: normalizeUsers(input.users)
            }
          ]
        }
      ]
    };
  }

  return createDefaultWorkbenchConfig({ defaultExecution: fallbackExecution, idFactory });
}

export function resolveExecutionConfig(
  workspace: WorkbenchConfig,
  group: WorkbenchGroup,
  item?: WorkbenchItem
): ExecutionConfig {
  return normalizeExecution(item?.execution, normalizeExecution(group.execution, workspace.defaultExecution));
}

export function getInitialWorkbenchSelection(workspace: WorkbenchConfig): WorkbenchSelection {
  const firstGroup = workspace.groups[0];
  if (!firstGroup) {
    return { type: "group", groupId: "" };
  }
  const firstItem = firstGroup.items[0];
  if (!firstItem) {
    return { type: "group", groupId: firstGroup.id };
  }
  return { type: "item", groupId: firstGroup.id, itemId: firstItem.id };
}

export function findWorkbenchGroup(workspace: WorkbenchConfig, groupID: string): WorkbenchGroup | undefined {
  for (const group of workspace.groups) {
    const found = findGroupInTree(group, groupID);
    if (found) return found;
  }
  return undefined;
}

export function findWorkbenchItem(group: WorkbenchGroup | undefined, itemID: string): WorkbenchItem | undefined {
  if (!group) return undefined;
  const direct = group.items.find((item) => item.id === itemID);
  if (direct) return direct;
  for (const child of group.groups ?? []) {
    const found = findWorkbenchItem(child, itemID);
    if (found) return found;
  }
  return undefined;
}

export function updateWorkbenchGroup(
  workspace: WorkbenchConfig,
  groupID: string,
  updater: (group: WorkbenchGroup) => WorkbenchGroup
): WorkbenchConfig {
  return {
    ...workspace,
    groups: workspace.groups.map((group) => updateGroupInTree(group, groupID, updater))
  };
}

export function updateWorkbenchItem(
  workspace: WorkbenchConfig,
  groupID: string,
  itemID: string,
  updater: (item: WorkbenchItem) => WorkbenchItem
): WorkbenchConfig {
  return updateWorkbenchGroup(workspace, groupID, (group) => ({
    ...group,
    items: group.items.map((item) => (item.id === itemID ? updater(item) : item))
  }));
}

export function removeWorkbenchGroup(workspace: WorkbenchConfig, groupID: string): WorkbenchConfig {
  if (workspace.groups.length <= 1) return workspace;
  return {
    ...workspace,
    groups: workspace.groups.filter((group) => group.id !== groupID)
  };
}

export function removeWorkbenchItem(workspace: WorkbenchConfig, groupID: string, itemID: string): WorkbenchConfig {
  return updateWorkbenchGroup(workspace, groupID, (group) => ({
    ...group,
    items: group.items.filter((item) => item.id !== itemID)
  }));
}

function normalizeGroup(input: WorkbenchGroup, idFactory: () => string): WorkbenchGroup {
  return {
    id: readString(input.id, idFactory()),
    name: readString(input.name, "Group"),
    execution: normalizeExecutionOverrides(input.execution),
    items: Array.isArray(input.items) ? input.items.map((item) => normalizeItem(item, idFactory)) : [],
    groups: Array.isArray(input.groups) ? input.groups.map((group) => normalizeGroup(group, idFactory)) : undefined
  };
}

function normalizeItem(input: WorkbenchItem, idFactory: () => string): WorkbenchItem {
  return {
    id: readString(input.id, idFactory()),
    name: readString(input.name, "Test Item"),
    execution: normalizeExecutionOverrides(input.execution),
    request: normalizeRequest(input.request),
    users: normalizeUsers(input.users)
  };
}

function findGroupInTree(group: WorkbenchGroup, groupID: string): WorkbenchGroup | undefined {
  if (group.id === groupID) return group;
  for (const child of group.groups ?? []) {
    const found = findGroupInTree(child, groupID);
    if (found) return found;
  }
  return undefined;
}

function updateGroupInTree(
  group: WorkbenchGroup,
  groupID: string,
  updater: (group: WorkbenchGroup) => WorkbenchGroup
): WorkbenchGroup {
  if (group.id === groupID) return updater(group);
  return {
    ...group,
    groups: group.groups?.map((child) => updateGroupInTree(child, groupID, updater))
  };
}

function normalizeExecution(input: unknown, fallback: ExecutionConfig): ExecutionConfig {
  const overrides = normalizeExecutionOverrides(input);
  return {
    threads: overrides.threads ?? fallback.threads,
    rampUpSeconds: overrides.rampUpSeconds ?? fallback.rampUpSeconds,
    loops: overrides.loops ?? fallback.loops,
    requestTimeoutMs: overrides.requestTimeoutMs ?? fallback.requestTimeoutMs,
    dryRun: overrides.dryRun ?? fallback.dryRun
  };
}

function normalizeExecutionOverrides(input: unknown): ExecutionOverrides {
  if (!isRecord(input)) return {};
  return {
    threads: readPositiveInteger(input.threads),
    rampUpSeconds: readNonNegativeInteger(input.rampUpSeconds),
    loops: readPositiveInteger(input.loops),
    requestTimeoutMs: readPositiveInteger(input.requestTimeoutMs),
    dryRun: typeof input.dryRun === "boolean" ? input.dryRun : undefined
  };
}

function normalizeRequest(input: unknown): RequestConfig {
  if (!isRecord(input)) return cloneRequest(DEFAULT_REQUEST);
  return {
    url: readString(input.url, ""),
    method: readString(input.method, "GET"),
    headers: isStringMap(input.headers) ? { ...input.headers } : {},
    body: readString(input.body, "")
  };
}

function normalizeUsers(input: unknown): UserConfig[] {
  if (!Array.isArray(input)) return [];
  return input.map((user) => {
    if (!isRecord(user)) return {};
    return {
      headers: isStringMap(user.headers) ? { ...user.headers } : {}
    };
  });
}

function cloneExecution(input: ExecutionConfig): ExecutionConfig {
  return { ...input };
}

function cloneRequest(input: RequestConfig): RequestConfig {
  return {
    ...input,
    headers: input.headers ? { ...input.headers } : undefined
  };
}

function isWorkbenchConfigLike(input: unknown): input is WorkbenchConfig {
  return isRecord(input) && input.version === 2 && Array.isArray(input.groups);
}

function isLegacyConfigLike(input: unknown): input is { request: RequestConfig; users?: UserConfig[] } {
  return isRecord(input) && isRecord(input.request);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function isStringMap(input: unknown): input is Record<string, string> {
  return isRecord(input) && Object.values(input).every((value) => typeof value === "string");
}

function readString(input: unknown, fallback: string) {
  return typeof input === "string" && input.trim() ? input : fallback;
}

function readPositiveInteger(input: unknown) {
  return typeof input === "number" && Number.isFinite(input) && input > 0 ? Math.floor(input) : undefined;
}

function readNonNegativeInteger(input: unknown) {
  return typeof input === "number" && Number.isFinite(input) && input >= 0 ? Math.floor(input) : undefined;
}
