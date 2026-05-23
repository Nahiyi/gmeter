import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const resultsCss = readFileSync(new URL("../src/styles/results.css", import.meta.url), "utf8");
const baseCss = readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8");

describe("results workbench layout css", () => {
  it("keeps trace filter labels horizontal in narrow windows", () => {
    assert.match(baseCss, /\.filter-group button[^{]*\{[^}]*white-space:\s*nowrap;/s);
    assert.match(resultsCss, /\.trace-toolbar[^{]*\{[^}]*overflow-x:\s*auto;/s);
  });

  it("uses a single scrollable body for trace inspector evidence", () => {
    assert.match(resultsCss, /\.trace-inspector[^{]*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);/s);
    assert.match(resultsCss, /\.trace-inspector-body[^{]*\{[^}]*overflow:\s*auto;/s);
  });
});
