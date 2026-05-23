export type Locale = "en" | "zh";

export type I18nKey =
  | "app.title"
  | "app.subtitle"
  | "command.open"
  | "command.save"
  | "command.run"
  | "command.stop"
  | "command.add"
  | "command.delete"
  | "command.addUser"
  | "command.remove"
  | "nav.runSetup"
  | "setup.threads"
  | "setup.rampUp"
  | "setup.loops"
  | "setup.timeout"
  | "setup.dryRun"
  | "request.profile"
  | "request.profileMode"
  | "request.method"
  | "request.url"
  | "request.headers"
  | "request.body"
  | "request.userHeaders"
  | "request.user"
  | "request.jsonPreview"
  | "table.key"
  | "table.value"
  | "summary.title"
  | "summary.requests"
  | "summary.success"
  | "summary.failed"
  | "summary.avg"
  | "summary.p90"
  | "summary.p99"
  | "trace.recent"
  | "trace.empty"
  | "trace.detail"
  | "trace.noSelection"
  | "trace.status"
  | "trace.time"
  | "trace.error"
  | "trace.responseBody"
  | "trace.emptyBody"
  | "trace.consolePrefix"
  | "trace.consoleHTTP"
  | "trace.consoleIn"
  | "request.noUserHeaders"
  | "console.ready"
  | "console.starting"
  | "console.loaded"
  | "console.openFailed"
  | "console.exported"
  | "console.validationFailed"
  | "console.runStarted"
  | "console.runFailed"
  | "console.stopRequested"
  | "console.stopFailed"
  | "status.idle"
  | "status.running"
  | "status.complete"
  | "status.canceled"
  | "status.invalid"
  | "status.failed";

const dictionaries: Record<Locale, Record<I18nKey, string>> = {
  en: {
    "app.title": "GMeter",
    "app.subtitle": "Desktop Workbench",
    "command.open": "Open",
    "command.save": "Save",
    "command.run": "Run",
    "command.stop": "Stop",
    "command.add": "Add",
    "command.delete": "Del",
    "command.addUser": "Add User",
    "command.remove": "Remove",
    "nav.runSetup": "Run Setup",
    "setup.threads": "Threads",
    "setup.rampUp": "Ramp-Up Seconds",
    "setup.loops": "Loops Per Thread",
    "setup.timeout": "Request Timeout",
    "setup.dryRun": "Dry Run",
    "request.profile": "Request Profile",
    "request.profileMode": "form + JSON preview",
    "request.method": "Method",
    "request.url": "URL",
    "request.headers": "Request Headers",
    "request.body": "Body",
    "request.userHeaders": "User Headers",
    "request.user": "User",
    "request.jsonPreview": "JSON Preview",
    "table.key": "Key",
    "table.value": "Value",
    "summary.title": "Live Summary",
    "summary.requests": "Requests",
    "summary.success": "Success",
    "summary.failed": "Failed",
    "summary.avg": "Avg",
    "summary.p90": "P90",
    "summary.p99": "P99",
    "trace.recent": "Recent Traces",
    "trace.empty": "No request traces yet.",
    "trace.detail": "Trace Detail",
    "trace.noSelection": "Select a trace to inspect request evidence.",
    "trace.status": "Status",
    "trace.time": "Time",
    "trace.error": "Error",
    "trace.responseBody": "Response Body",
    "trace.emptyBody": "(empty)",
    "trace.consolePrefix": "Trace",
    "trace.consoleHTTP": "HTTP",
    "trace.consoleIn": "in",
    "request.noUserHeaders": "No user headers. Requests will use shared headers only.",
    "console.ready": "Ready. Configure a GMeter load profile, then run.",
    "console.starting": "Starting run...",
    "console.loaded": "Loaded config",
    "console.openFailed": "Open failed",
    "console.exported": "Config exported.",
    "console.validationFailed": "Validation failed",
    "console.runStarted": "Run started",
    "console.runFailed": "Run failed",
    "console.stopRequested": "Stop requested.",
    "console.stopFailed": "Stop failed",
    "status.idle": "Idle",
    "status.running": "Running",
    "status.complete": "Complete",
    "status.canceled": "Canceled",
    "status.invalid": "Invalid",
    "status.failed": "Failed"
  },
  zh: {
    "app.title": "GMeter",
    "app.subtitle": "桌面压测工作台",
    "command.open": "打开",
    "command.save": "保存",
    "command.run": "运行",
    "command.stop": "停止",
    "command.add": "添加",
    "command.delete": "删除",
    "command.addUser": "添加用户",
    "command.remove": "移除",
    "nav.runSetup": "运行配置",
    "setup.threads": "线程数",
    "setup.rampUp": "Ramp-Up 秒数",
    "setup.loops": "每线程循环",
    "setup.timeout": "请求超时",
    "setup.dryRun": "仅验证",
    "request.profile": "请求配置",
    "request.profileMode": "表单 + JSON 预览",
    "request.method": "方法",
    "request.url": "URL",
    "request.headers": "请求头",
    "request.body": "请求体",
    "request.userHeaders": "用户请求头",
    "request.user": "用户",
    "request.jsonPreview": "JSON 预览",
    "table.key": "键",
    "table.value": "值",
    "summary.title": "运行概览",
    "summary.requests": "请求数",
    "summary.success": "成功",
    "summary.failed": "失败",
    "summary.avg": "平均",
    "summary.p90": "P90",
    "summary.p99": "P99",
    "trace.recent": "最近请求",
    "trace.empty": "暂无请求记录。",
    "trace.detail": "请求详情",
    "trace.noSelection": "选择一条请求记录查看详情。",
    "trace.status": "状态",
    "trace.time": "耗时",
    "trace.error": "错误",
    "trace.responseBody": "响应体",
    "trace.emptyBody": "（空）",
    "trace.consolePrefix": "请求",
    "trace.consoleHTTP": "HTTP",
    "trace.consoleIn": "耗时",
    "request.noUserHeaders": "暂无用户请求头，将仅使用公共请求头。",
    "console.ready": "就绪。配置 GMeter 压测计划后运行。",
    "console.starting": "开始运行...",
    "console.loaded": "已加载配置",
    "console.openFailed": "打开失败",
    "console.exported": "配置已导出。",
    "console.validationFailed": "验证失败",
    "console.runStarted": "运行已启动",
    "console.runFailed": "运行失败",
    "console.stopRequested": "已请求停止。",
    "console.stopFailed": "停止失败",
    "status.idle": "空闲",
    "status.running": "运行中",
    "status.complete": "完成",
    "status.canceled": "已取消",
    "status.invalid": "无效",
    "status.failed": "失败"
  }
};

export function getSavedLocale(): Locale {
  const value = window.localStorage.getItem("gmeter.locale");
  return value === "zh" || value === "en" ? value : "en";
}

export function saveLocale(locale: Locale) {
  window.localStorage.setItem("gmeter.locale", locale);
}

export function translate(locale: Locale, key: I18nKey) {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}
