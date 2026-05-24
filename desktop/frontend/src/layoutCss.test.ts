import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const resultsCss = readFileSync(new URL("../src/styles/results.css", import.meta.url), "utf8");
const baseCss = readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const summaryCss = readFileSync(new URL("../src/styles/summary.css", import.meta.url), "utf8");
const appTsx = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");

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
    assert.match(layoutCss, /\.window-command[^{]*\{[^}]*width:\s*40px;[^}]*height:\s*100%;/s);
    assert.match(layoutCss, /\.minimize-icon::before[^{]*\{[^}]*top:\s*6px;[^}]*height:\s*1\.5px;/s);
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
