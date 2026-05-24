export type Locale = "en" | "zh";

export type I18nKey =
  | "app.title"
  | "app.subtitle"
  | "command.open"
  | "command.save"
  | "command.run"
  | "command.stop"
  | "command.menu"
  | "command.language"
  | "command.startRun"
  | "command.stopRun"
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
  | "setup.planSummary"
  | "setup.totalRequests"
  | "setup.threadLoad"
  | "setup.rampProfile"
  | "setup.instantRamp"
  | "setup.userProfiles"
  | "setup.timeoutBudget"
  | "setup.mode"
  | "setup.modeDryRun"
  | "setup.modeLoad"
  | "setup.requestShape"
  | "setup.sharedHeaders"
  | "setup.userHeaders"
  | "setup.bodySize"
  | "setup.userCoverage"
  | "setup.sharedOnly"
  | "setup.covered"
  | "setup.missingUsers"
  | "setup.readyPlan"
  | "layout.collapsePanel"
  | "layout.expandPanel"
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
  | "results.allLatency"
  | "results.fastLatency"
  | "results.normalLatency"
  | "results.slowLatency"
  | "results.sortLatest"
  | "results.sortLatencyDesc"
  | "results.sortLatencyAsc"
  | "results.sortStatusAsc"
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
  | "console.validationPassed"
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
    "command.menu": "Menu",
    "command.language": "Language",
    "command.startRun": "Start run",
    "command.stopRun": "Stop run",
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
    "setup.planSummary": "Plan Summary",
    "setup.totalRequests": "Planned Requests",
    "setup.threadLoad": "Thread Load",
    "setup.rampProfile": "Ramp Profile",
    "setup.instantRamp": "Instant",
    "setup.userProfiles": "User Profiles",
    "setup.timeoutBudget": "Timeout Budget",
    "setup.mode": "Mode",
    "setup.modeDryRun": "Validation only",
    "setup.modeLoad": "Load test",
    "setup.requestShape": "Request Shape",
    "setup.sharedHeaders": "Shared Headers",
    "setup.userHeaders": "User Headers",
    "setup.bodySize": "Body Size",
    "setup.userCoverage": "User Coverage",
    "setup.sharedOnly": "Shared only",
    "setup.covered": "Covered",
    "setup.missingUsers": "Needs users",
    "setup.readyPlan": "Ready to run after configuration review.",
    "layout.collapsePanel": "Collapse panel",
    "layout.expandPanel": "Expand panel",
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
    "results.mode": "recent sample + detail",
    "results.empty": "Run a load test to populate the recent sample analysis.",
    "results.traceTable": "Trace Table",
    "results.traceInspector": "Trace Inspector",
    "results.failureGroups": "Sample Failure Groups",
    "results.statusGroups": "Sample Status Codes",
    "results.latencyDistribution": "Sample Latency Distribution",
    "results.statusDistribution": "Sample Status Distribution",
    "results.slowestRequests": "Sample Slowest Requests",
    "results.diagnostics": "Diagnostics",
    "results.diagnosticsClean": "No failed traces captured.",
    "results.diagnosticsFailures": "Failed traces",
    "results.diagnosticsSlowest": "Slowest trace",
    "results.diagnosticsStatusMix": "Dominant status",
    "results.diagnosticsNoData": "Recent sample data has not been captured yet.",
    "results.totalTraces": "Sample Traces",
    "results.failedTraces": "Sample Failed",
    "results.slowest": "Sample Slowest",
    "results.failureRate": "Sample Failure Rate",
    "results.filter": "Filter",
    "results.filterAll": "All",
    "results.filterFailed": "Failed",
    "results.filterSuccess": "Success",
    "results.search": "Search URL or error",
    "results.allStatuses": "All statuses",
    "results.allLatency": "All latency",
    "results.fastLatency": "<= 100 ms",
    "results.normalLatency": "101-300 ms",
    "results.slowLatency": "> 300 ms",
    "results.sortLatest": "Latest",
    "results.sortLatencyDesc": "Slowest first",
    "results.sortLatencyAsc": "Fastest first",
    "results.sortStatusAsc": "Status",
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
    "console.validationPassed": "Validation passed. No requests were sent.",
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
    "command.menu": "菜单",
    "command.language": "语言",
    "command.startRun": "开始运行",
    "command.stopRun": "停止运行",
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
    "setup.planSummary": "计划摘要",
    "setup.totalRequests": "计划请求数",
    "setup.threadLoad": "线程负载",
    "setup.rampProfile": "启动模型",
    "setup.instantRamp": "立即启动",
    "setup.userProfiles": "用户配置",
    "setup.timeoutBudget": "超时预算",
    "setup.mode": "运行模式",
    "setup.modeDryRun": "仅验证",
    "setup.modeLoad": "压测执行",
    "setup.requestShape": "请求结构",
    "setup.sharedHeaders": "公共请求头",
    "setup.userHeaders": "用户请求头",
    "setup.bodySize": "请求体大小",
    "setup.userCoverage": "用户覆盖",
    "setup.sharedOnly": "仅公共配置",
    "setup.covered": "已覆盖",
    "setup.missingUsers": "缺少用户",
    "setup.readyPlan": "配置检查后即可运行。",
    "layout.collapsePanel": "折叠面板",
    "layout.expandPanel": "展开面板",
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
    "results.mode": "最近样本 + 详情",
    "results.empty": "运行一次压测后，这里会显示最近样本分析。",
    "results.traceTable": "请求表格",
    "results.traceInspector": "请求检查器",
    "results.failureGroups": "样本失败分组",
    "results.statusGroups": "样本状态码",
    "results.latencyDistribution": "样本延迟分布",
    "results.statusDistribution": "样本状态分布",
    "results.slowestRequests": "样本慢请求",
    "results.diagnostics": "诊断摘要",
    "results.diagnosticsClean": "暂无失败请求记录。",
    "results.diagnosticsFailures": "失败请求",
    "results.diagnosticsSlowest": "最慢请求",
    "results.diagnosticsStatusMix": "主要状态",
    "results.diagnosticsNoData": "尚未捕获最近样本数据。",
    "results.totalTraces": "样本记录",
    "results.failedTraces": "样本失败",
    "results.slowest": "样本最慢",
    "results.failureRate": "样本失败率",
    "results.filter": "筛选",
    "results.filterAll": "全部",
    "results.filterFailed": "失败",
    "results.filterSuccess": "成功",
    "results.search": "搜索 URL 或错误",
    "results.allStatuses": "全部状态",
    "results.allLatency": "全部耗时",
    "results.fastLatency": "<= 100 ms",
    "results.normalLatency": "101-300 ms",
    "results.slowLatency": "> 300 ms",
    "results.sortLatest": "最新优先",
    "results.sortLatencyDesc": "最慢优先",
    "results.sortLatencyAsc": "最快优先",
    "results.sortStatusAsc": "按状态",
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
    "console.validationPassed": "验证通过，未发送请求。",
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
