import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const resultsCss = readFileSync(new URL("../src/styles/results.css", import.meta.url), "utf8");
const baseCss = readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const summaryCss = readFileSync(new URL("../src/styles/summary.css", import.meta.url), "utf8");

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
});
