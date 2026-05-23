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
  | "view.config"
  | "view.results"
  | "results.workbench"
  | "results.mode"
  | "results.empty"
  | "results.traceTable"
  | "results.traceInspector"
  | "results.failureGroups"
  | "results.statusGroups"
  | "results.latencyDistribution"
  | "results.statusDistribution"
  | "results.slowestRequests"
  | "results.diagnostics"
  | "results.diagnosticsClean"
  | "results.diagnosticsFailures"
  | "results.diagnosticsSlowest"
  | "results.diagnosticsStatusMix"
  | "results.diagnosticsNoData"
  | "results.totalTraces"
  | "results.failedTraces"
  | "results.slowest"
  | "results.failureRate"
  | "results.filter"
  | "results.filterAll"
  | "results.filterFailed"
  | "results.filterSuccess"
  | "results.search"
  | "results.allStatuses"
  | "results.thread"
  | "results.loop"
  | "results.request"
  | "results.method"
  | "results.url"
  | "results.latency"
  | "results.noMatches"
  | "results.requestEvidence"
  | "results.responseEvidence"
  | "results.headers"
  | "results.body"
  | "results.errorSummary"
  | "results.none"
  | "results.percentage"
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
    "view.config": "Config",
    "view.results": "Results",
    "results.workbench": "Results Workbench",
    "results.mode": "trace table + detail",
    "results.empty": "Run a load test to populate the result workbench.",
    "results.traceTable": "Trace Table",
    "results.traceInspector": "Trace Inspector",
    "results.failureGroups": "Failure Groups",
    "results.statusGroups": "Status Codes",
    "results.latencyDistribution": "Latency Distribution",
    "results.statusDistribution": "Status Distribution",
    "results.slowestRequests": "Slowest Requests",
    "results.diagnostics": "Diagnostics",
    "results.diagnosticsClean": "No failed traces captured.",
    "results.diagnosticsFailures": "Failed traces",
    "results.diagnosticsSlowest": "Slowest trace",
    "results.diagnosticsStatusMix": "Dominant status",
    "results.diagnosticsNoData": "Run data has not been captured yet.",
    "results.totalTraces": "Traces",
    "results.failedTraces": "Failed",
    "results.slowest": "Slowest",
    "results.failureRate": "Failure Rate",
    "results.filter": "Filter",
    "results.filterAll": "All",
    "results.filterFailed": "Failed",
    "results.filterSuccess": "Success",
    "results.search": "Search URL or error",
    "results.allStatuses": "All statuses",
    "results.thread": "Thread",
    "results.loop": "Loop",
    "results.request": "Request",
    "results.method": "Method",
    "results.url": "URL",
    "results.latency": "Latency",
    "results.noMatches": "No traces match the current filters.",
    "results.requestEvidence": "Request Evidence",
    "results.responseEvidence": "Response Evidence",
    "results.headers": "Headers",
    "results.body": "Body",
    "results.errorSummary": "Error Summary",
    "results.none": "None",
    "results.percentage": "Share",
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
    "view.config": "配置",
    "view.results": "结果",
    "results.workbench": "结果工作台",
    "results.mode": "请求表格 + 详情",
    "results.empty": "运行一次压测后，这里会显示结果分析。",
    "results.traceTable": "请求表格",
    "results.traceInspector": "请求检查器",
    "results.failureGroups": "失败分组",
    "results.statusGroups": "状态码",
    "results.latencyDistribution": "延迟分布",
    "results.statusDistribution": "状态分布",
    "results.slowestRequests": "慢请求",
    "results.diagnostics": "诊断摘要",
    "results.diagnosticsClean": "暂无失败请求记录。",
    "results.diagnosticsFailures": "失败请求",
    "results.diagnosticsSlowest": "最慢请求",
    "results.diagnosticsStatusMix": "主要状态",
    "results.diagnosticsNoData": "尚未捕获运行数据。",
    "results.totalTraces": "请求记录",
    "results.failedTraces": "失败",
    "results.slowest": "最慢",
    "results.failureRate": "失败率",
    "results.filter": "筛选",
    "results.filterAll": "全部",
    "results.filterFailed": "失败",
    "results.filterSuccess": "成功",
    "results.search": "搜索 URL 或错误",
    "results.allStatuses": "全部状态",
    "results.thread": "线程",
    "results.loop": "循环",
    "results.request": "请求",
    "results.method": "方法",
    "results.url": "URL",
    "results.latency": "耗时",
    "results.noMatches": "没有符合当前筛选条件的请求记录。",
    "results.requestEvidence": "请求证据",
    "results.responseEvidence": "响应证据",
    "results.headers": "请求头",
    "results.body": "请求体",
    "results.errorSummary": "错误摘要",
    "results.none": "无",
    "results.percentage": "占比",
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
