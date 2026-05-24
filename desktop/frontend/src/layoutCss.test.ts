import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const resultsCss = readFileSync(new URL("../src/styles/results.css", import.meta.url), "utf8");
const baseCss = readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8");
const configCss = readFileSync(new URL("../src/styles/config.css", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const summaryCss = readFileSync(new URL("../src/styles/summary.css", import.meta.url), "utf8");
const appTsx = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const runSetupPanelTsx = readFileSync(new URL("../src/components/RunSetupPanel.tsx", import.meta.url), "utf8");
const titlebarTsx = readFileSync(new URL("../src/components/Titlebar.tsx", import.meta.url), "utf8");
const resultsWorkbenchTsx = readFileSync(new URL("../src/components/results/ResultsWorkbench.tsx", import.meta.url), "utf8");
const runSummaryPanelTsx = readFileSync(new URL("../src/components/RunSummaryPanel.tsx", import.meta.url), "utf8");

describe("results workbench layout css", () => {
  it("keeps trace filter labels horizontal in narrow windows", () => {
    assert.match(baseCss, /\.filter-group button[^{]*\{[^}]*white-space:\s*nowrap;/s);
    assert.match(resultsCss, /\.trace-toolbar[^{]*\{[^}]*overflow-x:\s*auto;/s);
  });

  it("uses a single scrollable body for trace inspector evidence", () => {
    assert.match(resultsCss, /\.trace-inspector[^{]*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);/s);
    assert.match(resultsCss, /\.trace-inspector-body[^{]*\{[^}]*overflow:\s*auto;/s);
  });

  it("supports collapsible side panels and readable recent trace rows", () => {
    assert.match(layoutCss, /\.workspace\.setup-collapsed[^{]*\{[^}]*grid-template-columns:\s*42px minmax\(360px,\s*1fr\) 300px;/s);
    assert.match(layoutCss, /\.workspace\.summary-collapsed[^{]*\{[^}]*grid-template-columns:\s*260px minmax\(360px,\s*1fr\) 42px;/s);
    assert.match(layoutCss, /\.collapse-button span::before[^{]*\{/s);
    assert.doesNotMatch(layoutCss, /\.rail-toggle span[^{]*\{[^}]*rotate\(180deg\)/s);
    assert.match(summaryCss, /\.trace-row[^{]*\{[^}]*grid-template-columns:\s*minmax\(74px,\s*1fr\) 62px 72px;/s);
  });

  it("marks only the custom titlebar drag region as draggable", () => {
    assert.match(layoutCss, /\.titlebar-drag-region[^{]*\{[^}]*--wails-draggable:\s*drag;/s);
    assert.match(layoutCss, /\.titlebar button[^{]*\{[^}]*--wails-draggable:\s*no-drag;/s);
    assert.match(layoutCss, /\.window-controls[^{]*\{[^}]*--wails-draggable:\s*no-drag;/s);
  });

  it("keeps custom titlebar controls visually aligned", () => {
    assert.match(layoutCss, /\.titlebar-control[^{]*\{[^}]*display:\s*inline-grid;[^}]*place-items:\s*center;[^}]*width:\s*34px;[^}]*height:\s*32px;/s);
    assert.match(layoutCss, /\.menu-trigger[^{]*\{[^}]*background:\s*transparent;[^}]*border-color:\s*transparent;/s);
    assert.match(layoutCss, /button\.icon-command\.primary:not\(:disabled\):hover[^{]*\{[^}]*background:\s*#286849;/s);
    assert.match(layoutCss, /button\.icon-command\.primary:disabled[^{]*\{[^}]*background:\s*#2f7a54;[^}]*cursor:\s*not-allowed;/s);
    assert.match(layoutCss, /button\.icon-command\.primary:disabled:hover[^{]*\{[^}]*background:\s*#2f7a54;/s);
    assert.match(layoutCss, /\.window-command[^{]*\{[^}]*width:\s*40px;[^}]*height:\s*100%;/s);
    assert.match(layoutCss, /\.minimize-icon::before[^{]*\{[^}]*top:\s*6px;[^}]*height:\s*1\.5px;/s);
  });

  it("keeps the run setup content scrollable in short windows", () => {
    assert.match(runSetupPanelTsx, /className="setup-panel-body"/s);
    assert.match(runSetupPanelTsx, /className="setup-summary-body"/s);
    assert.match(layoutCss, /\.app-shell[^{]*\{[^}]*overflow:\s*hidden;/s);
    assert.match(layoutCss, /\.workspace[^{]*\{[^}]*overflow:\s*hidden;/s);
    assert.match(configCss, /\.setup-panel[^{]*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);[^}]*height:\s*100%;[^}]*overflow:\s*hidden;/s);
    assert.match(configCss, /\.setup-panel-body[^{]*\{[^}]*grid-template-rows:\s*minmax\(150px,\s*1fr\) minmax\(180px,\s*0\.8fr\);[^}]*overflow:\s*hidden;/s);
    assert.match(configCss, /\.plan-navigator[^{]*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);[^}]*overflow:\s*hidden;/s);
    assert.match(configCss, /\.plan-tree[^{]*\{[^}]*overflow-y:\s*auto;/s);
    assert.match(configCss, /\.setup-summary[^{]*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);[^}]*min-height:\s*0;/s);
    assert.match(configCss, /\.setup-summary-body[^{]*\{[^}]*overflow-y:\s*auto;/s);
  });

  it("separates group and item run commands by selection level", () => {
    assert.match(titlebarTsx, /canRunGroup:\s*boolean/s);
    assert.match(titlebarTsx, /canRunItem:\s*boolean/s);
    assert.match(titlebarTsx, /onRunGroup:\s*\(\)\s*=>\s*void/s);
    assert.match(titlebarTsx, /onRunItem:\s*\(\)\s*=>\s*void/s);
    assert.match(titlebarTsx, /className="icon run-group-icon"/s);
    assert.match(titlebarTsx, /disabled=\{!props\.canRunGroup\}/s);
    assert.match(titlebarTsx, /disabled=\{!props\.canRunItem\}/s);
    assert.match(appTsx, /canRunGroup=\{selectedKind === "group" && !isRunning\}/s);
    assert.match(appTsx, /canRunItem=\{selectedKind === "item" && !isRunning\}/s);
  });

  it("allows groups in the plan navigator to collapse without removing the group row", () => {
    const planNavigatorTsx = readFileSync(new URL("../src/components/plan/PlanNavigator.tsx", import.meta.url), "utf8");
    assert.match(planNavigatorTsx, /useState<Set<string>>/s);
    assert.match(planNavigatorTsx, /plan-collapse-button/s);
    assert.match(planNavigatorTsx, /aria-expanded=\{!collapsedGroupIDs\.has\(group\.id\)\}/s);
    assert.match(planNavigatorTsx, /!collapsedGroupIDs\.has\(group\.id\) \? \(/s);
    assert.match(configCss, /\.plan-collapse-button[^{]*\{/s);
    assert.match(configCss, /\.collapse-chevron[^{]*\{[^}]*transform:\s*rotate\(45deg\);/s);
    assert.match(configCss, /\.plan-collapse-button\.collapsed \.collapse-chevron[^{]*\{[^}]*transform:\s*rotate\(-45deg\);/s);
  });

  it("uses clean plan tree folder and item icons", () => {
    assert.match(configCss, /\.folder-icon[^{]*\{[^}]*width:\s*14px;[^}]*height:\s*12px;[^}]*border:\s*none;/s);
    assert.match(configCss, /\.folder-icon::before[^{]*\{[^}]*box-sizing:\s*border-box;[^}]*top:\s*4px;[^}]*width:\s*13px;[^}]*height:\s*8px;/s);
    assert.match(configCss, /\.folder-icon::after[^{]*\{[^}]*box-sizing:\s*border-box;[^}]*top:\s*1px;[^}]*width:\s*7px;[^}]*border-bottom:\s*none;/s);
    assert.match(configCss, /\.item-icon[^{]*\{[^}]*border:\s*1\.5px solid currentColor;/s);
  });

  it("keeps result analysis in the center and live signals in the right rail", () => {
    assert.match(resultsWorkbenchTsx, /results\.successRate/s);
    assert.match(resultsWorkbenchTsx, /results\.avgLatency/s);
    assert.match(resultsWorkbenchTsx, /results\.p90Latency/s);
    assert.match(resultsWorkbenchTsx, /results\.p99Latency/s);
    assert.match(resultsWorkbenchTsx, /results\.outcome/s);
    assert.match(resultsWorkbenchTsx, /results\.errorBrief/s);
    assert.match(resultsWorkbenchTsx, /className="trace-inspector-summary"/s);
    assert.match(resultsWorkbenchTsx, /className="[^"]*evidence-grid/s);
    assert.match(resultsCss, /\.trace-table-row[^{]*\{[^}]*min-width:\s*980px;/s);
    assert.match(resultsCss, /\.trace-inspector-summary[^{]*\{/s);
    assert.match(resultsCss, /\.evidence-grid[^{]*\{/s);
    assert.doesNotMatch(runSummaryPanelTsx, /className="metric-grid"/s);
    assert.match(runSummaryPanelTsx, /className="signal-board"/s);
    assert.match(runSummaryPanelTsx, /summary\.liveSignals/s);
    assert.match(summaryCss, /\.signal-board[^{]*\{/s);
    assert.match(summaryCss, /\.console-panel[^{]*\{/s);
    assert.match(baseCss, /html\[data-theme="dark"\] \.latency-summary-panel/s);
    assert.match(baseCss, /html\[data-theme="dark"\] \.signal-board/s);
  });

  it("supports dark theme and blocks browser-style zoom gestures", () => {
    assert.match(baseCss, /html\[data-theme="dark"\][^{]*\{/s);
    assert.match(baseCss, /color-scheme:\s*dark;/s);
    assert.match(appTsx, /addEventListener\("wheel"[^;]+passive:\s*false/s);
    assert.match(appTsx, /event\.ctrlKey[\s\S]+event\.preventDefault\(\)/s);
  });

  it("uses an in-app delete confirmation dialog instead of browser confirm", () => {
    assert.doesNotMatch(appTsx, /window\.confirm/);
    assert.match(appTsx, /<ConfirmDialog/s);
    assert.doesNotMatch(baseCss, /\.confirm-dialog-icon/);
    assert.doesNotMatch(readFileSync(new URL("../src/components/ConfirmDialog.tsx", import.meta.url), "utf8"), /confirm-dialog-icon/);
    assert.match(baseCss, /\.modal-backdrop[^{]*\{/s);
    assert.match(baseCss, /\.confirm-dialog[^{]*\{/s);
    assert.match(baseCss, /\.confirm-dialog::before[^{]*\{/s);
  });

  it("shows a bounded hierarchy preview when deleting a group", () => {
    const confirmDialogTsx = readFileSync(new URL("../src/components/ConfirmDialog.tsx", import.meta.url), "utf8");
    assert.match(appTsx, /previewItems:\s*group\.items\.slice\(0,\s*5\)\.map\(\(item\)\s*=>\s*item\.name\)/s);
    assert.match(appTsx, /hiddenItemCount:\s*Math\.max\(0,\s*group\.items\.length - 5\)/s);
    assert.match(appTsx, /translate\(locale,\s*"plan\.moreItems"\)\.replace\("\{count\}",\s*String\(confirmDeleteRequest\.hiddenItemCount\)\)/s);
    assert.match(confirmDialogTsx, /previewItems\?:\s*string\[\]/s);
    assert.match(confirmDialogTsx, /overflowLabel\?:\s*string/s);
    assert.match(confirmDialogTsx, /confirm-dialog-children/s);
    assert.match(confirmDialogTsx, /confirm-dialog-more/s);
    assert.match(baseCss, /\.confirm-dialog-child[^{]*\{[^}]*padding-left:\s*18px;/s);
    assert.match(baseCss, /\.confirm-dialog-more[^{]*\{/s);
  });
});
