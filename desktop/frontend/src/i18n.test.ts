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
    assert.equal(translate("en", "command.minimize"), "Minimize");
    assert.equal(translate("zh", "command.minimize"), "最小化");
    assert.equal(translate("en", "command.maximize"), "Maximize");
    assert.equal(translate("zh", "command.maximize"), "最大化");
    assert.equal(translate("en", "command.close"), "Close");
    assert.equal(translate("zh", "command.close"), "关闭");
    assert.equal(translate("en", "command.theme"), "Theme");
    assert.equal(translate("zh", "command.theme"), "主题");
    assert.equal(translate("en", "theme.system"), "System");
    assert.equal(translate("zh", "theme.system"), "跟随系统");
    assert.equal(translate("en", "theme.dark"), "Dark");
    assert.equal(translate("zh", "theme.dark"), "暗色");
  });
});

describe("run setup side panel labels", () => {
  it("provides labels for richer run setup summaries", () => {
    assert.equal(translate("en", "setup.planSummary"), "Plan Summary");
    assert.equal(translate("zh", "setup.planSummary"), "计划摘要");
    assert.equal(translate("en", "setup.totalRequests"), "Planned Requests");
    assert.equal(translate("zh", "setup.totalRequests"), "计划请求数");
    assert.equal(translate("en", "setup.instantRamp"), "Instant");
    assert.equal(translate("zh", "setup.instantRamp"), "立即启动");
    assert.equal(translate("en", "setup.mode"), "Mode");
    assert.equal(translate("zh", "setup.mode"), "运行模式");
    assert.equal(translate("en", "setup.requestShape"), "Request Shape");
    assert.equal(translate("zh", "setup.requestShape"), "请求结构");
  });
});
