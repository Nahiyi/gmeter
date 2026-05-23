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

describe("titlebar command labels", () => {
  it("provides desktop menu and icon button labels", () => {
    assert.equal(translate("en", "command.menu"), "Menu");
    assert.equal(translate("zh", "command.menu"), "菜单");
    assert.equal(translate("en", "command.startRun"), "Start run");
    assert.equal(translate("zh", "command.startRun"), "开始运行");
    assert.equal(translate("en", "command.stopRun"), "Stop run");
    assert.equal(translate("zh", "command.stopRun"), "停止运行");
  });
});
