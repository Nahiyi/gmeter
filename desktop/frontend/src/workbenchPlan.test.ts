import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createWorkbenchGroup,
  createWorkbenchItem,
  DEFAULT_EXECUTION_CONFIG,
  findWorkbenchGroup,
  findWorkbenchItem,
  getInitialWorkbenchSelection,
  normalizeWorkbenchConfig,
  removeWorkbenchGroup,
  removeWorkbenchItem,
  resolveExecutionConfig,
  updateWorkbenchGroup,
  updateWorkbenchItem
} from "./workbenchPlan.js";
import type { WorkbenchConfig } from "./workbenchPlan.js";

describe("normalizeWorkbenchConfig", () => {
  it("creates a default workspace that runs with shared request settings only", () => {
    const workspace = normalizeWorkbenchConfig(null, {
      idFactory: (() => {
        let nextID = 0;
        return () => `default-${++nextID}`;
      })()
    });

    assert.equal(workspace.groups[0].items[0].users?.length, 0);
  });

  it("wraps legacy single-request JSON into a default workspace group and item", () => {
    let nextID = 0;
    const legacyConfig = {
      request: {
        url: "https://example.com/api",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      },
      users: [{ headers: { token: "user-token" } }]
    };

    const workspace = normalizeWorkbenchConfig(legacyConfig, {
      defaultExecution: {
        threads: 6,
        rampUpSeconds: 2,
        loops: 3,
        requestTimeoutMs: 900,
        dryRun: true
      },
      idFactory: () => `id-${++nextID}`
    });

    assert.equal(workspace.version, 2);
    assert.equal(workspace.name, "GMeter Workspace");
    assert.deepEqual(workspace.defaultExecution, {
      threads: 6,
      rampUpSeconds: 2,
      loops: 3,
      requestTimeoutMs: 900,
      dryRun: true
    });
    assert.equal(workspace.groups.length, 1);
    assert.equal(workspace.groups[0].id, "id-1");
    assert.equal(workspace.groups[0].name, "Default Group");
    assert.equal(workspace.groups[0].items.length, 1);
    assert.equal(workspace.groups[0].items[0].id, "id-2");
    assert.equal(workspace.groups[0].items[0].name, "Desktop Run");
    assert.deepEqual(workspace.groups[0].items[0].request, legacyConfig.request);
    assert.deepEqual(workspace.groups[0].items[0].users, legacyConfig.users);
  });

  it("normalizes existing workspace JSON without flattening nested groups", () => {
    const workspace = normalizeWorkbenchConfig({
      version: 2,
      name: "Smoke Suite",
      defaultExecution: DEFAULT_EXECUTION_CONFIG,
      groups: [
        {
          id: "group-api",
          name: "API",
          execution: { threads: 4 },
          items: [],
          groups: [
            {
              id: "group-nested",
              name: "Nested for future UI",
              execution: { loops: 2 },
              items: []
            }
          ]
        }
      ]
    });

    assert.equal(workspace.groups.length, 1);
    assert.equal(workspace.groups[0].groups?.length, 1);
    assert.equal(workspace.groups[0].groups?.[0].name, "Nested for future UI");
  });
});

describe("resolveExecutionConfig", () => {
  it("merges workspace defaults, group overrides, and item overrides", () => {
    const workspace: WorkbenchConfig = {
      version: 2,
      name: "Execution Inheritance",
      defaultExecution: {
        threads: 10,
        rampUpSeconds: 0,
        loops: 1,
        requestTimeoutMs: 5000,
        dryRun: false
      },
      groups: [
        {
          id: "group-1",
          name: "Checkout",
          execution: { threads: 4, dryRun: true },
          items: [
            {
              id: "item-1",
              name: "Create Order",
              execution: { loops: 5, dryRun: false },
              request: { method: "POST", url: "https://example.com/order" },
              users: []
            }
          ]
        }
      ]
    };

    const group = workspace.groups[0];
    const item = group.items[0];

    assert.deepEqual(resolveExecutionConfig(workspace, group), {
      threads: 4,
      rampUpSeconds: 0,
      loops: 1,
      requestTimeoutMs: 5000,
      dryRun: true
    });
    assert.deepEqual(resolveExecutionConfig(workspace, group, item), {
      threads: 4,
      rampUpSeconds: 0,
      loops: 5,
      requestTimeoutMs: 5000,
      dryRun: false
    });
  });
});

describe("workbench selection helpers", () => {
  it("selects the first test item and updates groups/items immutably", () => {
    const workspace = normalizeWorkbenchConfig({
      version: 2,
      name: "Mutable Suite",
      defaultExecution: DEFAULT_EXECUTION_CONFIG,
      groups: [
        {
          id: "group-1",
          name: "Before",
          execution: {},
          items: [
            {
              id: "item-1",
              name: "Before Item",
              execution: {},
              request: { method: "GET", url: "https://example.com/api" },
              users: []
            }
          ]
        }
      ]
    });

    assert.deepEqual(getInitialWorkbenchSelection(workspace), {
      type: "item",
      groupId: "group-1",
      itemId: "item-1"
    });

    const renamedGroup = updateWorkbenchGroup(workspace, "group-1", (group) => ({
      ...group,
      name: "After"
    }));
    const renamedItem = updateWorkbenchItem(renamedGroup, "group-1", "item-1", (item) => ({
      ...item,
      name: "After Item"
    }));

    assert.equal(findWorkbenchGroup(workspace, "group-1")?.name, "Before");
    assert.equal(findWorkbenchItem(findWorkbenchGroup(workspace, "group-1"), "item-1")?.name, "Before Item");
    assert.equal(findWorkbenchGroup(renamedItem, "group-1")?.name, "After");
    assert.equal(findWorkbenchItem(findWorkbenchGroup(renamedItem, "group-1"), "item-1")?.name, "After Item");
  });

  it("creates new groups and items with stable defaults", () => {
    let nextID = 0;
    const idFactory = () => `new-${++nextID}`;

    const group = createWorkbenchGroup(idFactory, "Payments");
    const item = createWorkbenchItem(idFactory, "Create Payment");

    assert.equal(group.id, "new-1");
    assert.equal(group.name, "Payments");
    assert.deepEqual(group.execution, {});
    assert.deepEqual(group.items, []);
    assert.equal(item.id, "new-2");
    assert.equal(item.name, "Create Payment");
    assert.equal(item.request.method, "GET");
    assert.equal(item.request.url, "");
    assert.deepEqual(item.execution, {});
  });

  it("removes groups and keeps at least one group in the workspace", () => {
    const workspace = normalizeWorkbenchConfig({
      version: 2,
      name: "Deletion Suite",
      defaultExecution: DEFAULT_EXECUTION_CONFIG,
      groups: [
        { id: "group-1", name: "Keep", execution: {}, items: [] },
        { id: "group-2", name: "Remove", execution: {}, items: [] }
      ]
    });

    const removed = removeWorkbenchGroup(workspace, "group-2");
    const unchanged = removeWorkbenchGroup(removed, "group-1");

    assert.deepEqual(removed.groups.map((group) => group.id), ["group-1"]);
    assert.deepEqual(unchanged.groups.map((group) => group.id), ["group-1"]);
  });

  it("removes items from the target group without mutating the original workspace", () => {
    const workspace = normalizeWorkbenchConfig({
      version: 2,
      name: "Item Deletion Suite",
      defaultExecution: DEFAULT_EXECUTION_CONFIG,
      groups: [
        {
          id: "group-1",
          name: "API",
          execution: {},
          items: [
            { id: "item-1", name: "Keep", execution: {}, request: { method: "GET", url: "https://example.com/keep" }, users: [] },
            { id: "item-2", name: "Remove", execution: {}, request: { method: "GET", url: "https://example.com/remove" }, users: [] }
          ]
        }
      ]
    });

    const removed = removeWorkbenchItem(workspace, "group-1", "item-2");

    assert.deepEqual(workspace.groups[0].items.map((item) => item.id), ["item-1", "item-2"]);
    assert.deepEqual(removed.groups[0].items.map((item) => item.id), ["item-1"]);
  });
});
