import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { translate } from "./i18n.js";

describe("result workbench labels", () => {
  it("marks the result workbench as recent sample analysis", () => {
    assert.match(translate("en", "results.totalTraces"), /Sample/);
    assert.match(translate("zh", "results.totalTraces"), /样本/);
    assert.match(translate("en", "results.mode"), /sample/);
    assert.match(translate("zh", "results.mode"), /样本/);
  });
});
