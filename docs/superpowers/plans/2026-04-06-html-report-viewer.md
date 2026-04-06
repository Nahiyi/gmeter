# HTML Report Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个 HTML 页面，用于解析和展示 gometer 生成的 JSON 压测报告，包含列表、聚合统计和详情查看功能。

**Architecture:** 单文件 HTML 应用，使用原生 JavaScript 实现 JSON 解析和 DOM 渲染。页面分为三个区域：概览统计面板、请求列表表格、请求详情弹窗。

**Tech Stack:** 原生 HTML + CSS + JavaScript（无框架依赖），FileReader API 读取本地 JSON 文件

---

## File Structure

```
gometer/
├── viewer.html                    # HTML 报告查看器（单文件）
└── docs/superpowers/plans/
    └── 2026-04-06-html-report-viewer.md
```

---

## Task 1: 创建 HTML 页面基础结构和样式

**Files:**
- Create: `viewer.html`

- [ ] **Step 1: 创建基础 HTML 结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoMeter Report Viewer</title>
    <style>
        :root {
            --primary-color: #18A058;
            --primary-light: #e8f5ee;
            --bg-color: #ffffff;
            --bg-secondary: #f5f5f5;
            --text-color: #333333;
            --text-secondary: #666666;
            --border-color: #e0e0e0;
            --success-color: #18A058;
            --error-color: #dc3545;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-secondary);
            color: var(--text-color);
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: var(--bg-color);
            padding: 20px 30px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .header h1 {
            color: var(--primary-color);
            font-size: 24px;
            margin-bottom: 10px;
        }

        .upload-area {
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            transition: border-color 0.3s;
            cursor: pointer;
        }

        .upload-area:hover {
            border-color: var(--primary-color);
        }

        .upload-area input {
            display: none;
        }

        .upload-area p {
            color: var(--text-secondary);
        }

        .upload-btn {
            display: inline-block;
            background: var(--primary-color);
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            margin-top: 10px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .upload-btn:hover {
            background: #147a4a;
        }

        .stats-panel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: var(--bg-color);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .stat-card .label {
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        .stat-card .value {
            font-size: 28px;
            font-weight: 600;
            color: var(--primary-color);
        }

        .stat-card .value.error {
            color: var(--error-color);
        }

        .stat-card .sub {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 5px;
        }

        .content-panel {
            background: var(--bg-color);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        .panel-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            font-weight: 600;
        }

        .request-table {
            width: 100%;
            border-collapse: collapse;
        }

        .request-table th,
        .request-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .request-table th {
            background: var(--bg-secondary);
            font-weight: 600;
            font-size: 14px;
        }

        .request-table tr:hover {
            background: var(--primary-light);
        }

        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .status-badge.success {
            background: var(--primary-light);
            color: var(--primary-color);
        }

        .status-badge.error {
            background: #fde8ea;
            color: var(--error-color);
        }

        .detail-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .detail-modal.active {
            display: flex;
        }

        .modal-content {
            background: var(--bg-color);
            border-radius: 12px;
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            overflow: auto;
        }

        .modal-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-secondary);
        }

        .modal-body {
            padding: 20px;
        }

        .detail-section {
            margin-bottom: 20px;
        }

        .detail-section h4 {
            color: var(--primary-color);
            margin-bottom: 10px;
            font-size: 14px;
        }

        .detail-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid var(--bg-secondary);
        }

        .detail-row .key {
            width: 140px;
            color: var(--text-secondary);
            flex-shrink: 0;
        }

        .detail-row .value {
            flex: 1;
            word-break: break-all;
        }

        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>GoMeter Report Viewer</h1>
            <div class="upload-area" id="uploadArea">
                <input type="file" id="fileInput" accept=".json">
                <p>点击选择 JSON 报告文件，或拖拽到此处</p>
                <span class="upload-btn">选择文件</span>
            </div>
        </div>

        <div id="statsContainer" class="hidden">
            <div class="stats-panel">
                <div class="stat-card">
                    <div class="label">总请求数</div>
                    <div class="value" id="totalRequests">0</div>
                </div>
                <div class="stat-card">
                    <div class="label">成功率</div>
                    <div class="value" id="successRate">0%</div>
                </div>
                <div class="stat-card">
                    <div class="label">失败数</div>
                    <div class="value error" id="failCount">0</div>
                </div>
                <div class="stat-card">
                    <div class="label">平均响应时间</div>
                    <div class="value" id="avgTime">0ms</div>
                </div>
                <div class="stat-card">
                    <div class="label">P90 响应时间</div>
                    <div class="value" id="p90Time">0ms</div>
                </div>
                <div class="stat-card">
                    <div class="label">最大响应时间</div>
                    <div class="value" id="maxTime">0ms</div>
                </div>
            </div>

            <div class="content-panel">
                <div class="panel-header">请求详情列表</div>
                <table class="request-table">
                    <thead>
                        <tr>
                            <th>线程</th>
                            <th>循环</th>
                            <th>请求</th>
                            <th>URL</th>
                            <th>方法</th>
                            <th>状态</th>
                            <th>响应时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="requestTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="detail-modal" id="detailModal">
        <div class="modal-content">
            <div class="modal-header">
                <span>请求详情</span>
                <button class="modal-close" onclick="closeDetail()">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
            </div>
        </div>
    </div>
</body>
</html>
```

- [ ] **Step 2: 保存文件**

保存上述完整 HTML 到 `viewer.html`

- [ ] **Step 3: 测试文件存在**

```bash
ls -la viewer.html
```

---

## Task 2: 添加 JavaScript 功能逻辑

**Files:**
- Modify: `viewer.html` (在 `</body>` 前添加 `<script>` 部分)

- [ ] **Step 1: 添加 JavaScript 代码**

在 `</body>` 前添加：

```javascript
<script>
    let currentReport = null;

    // 文件上传事件绑定
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#18A058';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#e0e0e0';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e0e0e0';
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadFile(file);
    });

    function loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                currentReport = JSON.parse(e.target.result);
                renderReport(currentReport);
            } catch (err) {
                alert('无效的 JSON 文件');
            }
        };
        reader.readAsText(file);
    }

    function renderReport(report) {
        document.getElementById('statsContainer').classList.remove('hidden');

        // 渲染统计面板
        const summary = report.summary;
        document.getElementById('totalRequests').textContent = summary.totalRequests;
        document.getElementById('successRate').textContent = (summary.successRate * 100).toFixed(1) + '%';
        document.getElementById('failCount').textContent = summary.failCount;
        document.getElementById('avgTime').textContent = summary.avgResponseTimeMs.toFixed(1) + 'ms';
        document.getElementById('p90Time').textContent = summary.p90ResponseTimeMs + 'ms';
        document.getElementById('maxTime').textContent = summary.maxResponseTimeMs + 'ms';

        // 渲染请求列表
        const tbody = document.getElementById('requestTableBody');
        tbody.innerHTML = '';

        let rowIndex = 0;
        report.threads.forEach(thread => {
            thread.loopResults.forEach(loop => {
                loop.requests.forEach(req => {
                    const tr = document.createElement('tr');
                    const statusClass = req.success ? 'success' : 'error';
                    const statusText = req.success ? '成功' : '失败';
                    tr.innerHTML = `
                        <td>${thread.threadId}</td>
                        <td>${loop.loopIndex}</td>
                        <td>${req.requestIndex}</td>
                        <td>${truncateUrl(req.url)}</td>
                        <td>${req.method}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${req.responseTimeMs}ms</td>
                        <td><a href="#" onclick="showDetail(${rowIndex})">查看</a></td>
                    `;
                    tbody.appendChild(tr);
                    rowIndex++;
                });
            });
        });

        // 存储所有请求数据用于详情查看
        window.allRequests = [];
        report.threads.forEach(thread => {
            thread.loopResults.forEach(loop => {
                loop.requests.forEach(req => {
                    window.allRequests.push({ thread, loop, req });
                });
            });
        });
    }

    function truncateUrl(url) {
        if (url.length > 50) {
            return url.substring(0, 50) + '...';
        }
        return url;
    }

    function showDetail(index) {
        const { thread, loop, req } = window.allRequests[index];
        const modal = document.getElementById('detailModal');
        const body = document.getElementById('modalBody');

        body.innerHTML = `
            <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-row"><span class="key">线程ID</span><span class="value">${thread.threadId}</span></div>
                <div class="detail-row"><span class="key">循环次数</span><span class="value">${loop.loopIndex}</span></div>
                <div class="detail-row"><span class="key">请求索引</span><span class="value">${req.requestIndex}</span></div>
            </div>
            <div class="detail-section">
                <h4>请求信息</h4>
                <div class="detail-row"><span class="key">URL</span><span class="value">${req.url}</span></div>
                <div class="detail-row"><span class="key">Method</span><span class="value">${req.method}</span></div>
                <div class="detail-row"><span class="key">请求Headers</span><span class="value">${JSON.stringify(req.requestHeaders, null, 2)}</span></div>
                <div class="detail-row"><span class="key">请求Body</span><span class="value">${req.requestBody || '(空)'}</span></div>
            </div>
            <div class="detail-section">
                <h4>响应信息</h4>
                <div class="detail-row"><span class="key">状态码</span><span class="value">${req.responseStatus}</span></div>
                <div class="detail-row"><span class="key">响应时间</span><span class="value">${req.responseTimeMs}ms</span></div>
                <div class="detail-row"><span class="key">响应Headers</span><span class="value">${JSON.stringify(req.responseHeaders, null, 2)}</span></div>
                <div class="detail-row"><span class="key">成功</span><span class="value">${req.success ? '是' : '否'}</span></div>
                ${req.error ? `<div class="detail-row"><span class="key">错误信息</span><span class="value" style="color:#dc3545">${req.error}</span></div>` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    function closeDetail() {
        document.getElementById('detailModal').classList.remove('active');
    }

    // 点击模态框外部关闭
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            closeDetail();
        }
    });
</script>
```

---

## Task 3: 验证 HTML 功能

**Files:**
- Create: `test-report.json` (测试用的 JSON 报告)

- [ ] **Step 1: 创建测试报告文件**

```json
{
  "summary": {
    "totalThreads": 2,
    "totalLoops": 2,
    "totalRequests": 4,
    "successCount": 3,
    "failCount": 1,
    "successRate": 0.75,
    "durationMs": 1234,
    "avgResponseTimeMs": 150.5,
    "minResponseTimeMs": 80,
    "maxResponseTimeMs": 350,
    "p50ResponseTimeMs": 120,
    "p90ResponseTimeMs": 300,
    "p99ResponseTimeMs": 350
  },
  "threads": [
    {
      "threadId": 1,
      "loopResults": [
        {
          "loopIndex": 1,
          "requests": [
            {
              "requestIndex": 1,
              "url": "http://example.com/api",
              "method": "POST",
              "requestHeaders": {"Content-Type": "application/json"},
              "requestBody": "{}",
              "responseStatus": 200,
              "responseTimeMs": 120,
              "responseHeaders": {},
              "success": true,
              "error": null
            }
          ]
        }
      ]
    },
    {
      "threadId": 2,
      "loopResults": [
        {
          "loopIndex": 1,
          "requests": [
            {
              "requestIndex": 1,
              "url": "http://example.com/api",
              "method": "POST",
              "requestHeaders": {"Content-Type": "application/json"},
              "requestBody": "{}",
              "responseStatus": 500,
              "responseTimeMs": 50,
              "responseHeaders": {},
              "success": false,
              "error": "HTTP 500: internal server error"
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: 验证 HTML 文件可以用浏览器打开**

确认文件存在且内容完整

```bash
head -30 viewer.html
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - [x] 简约风格（白色背景，绿色主题）
   - [x] 文件上传区域（点击和拖拽）
   - [x] 聚合统计面板（6个指标卡片）
   - [x] 请求列表表格
   - [x] 请求详情弹窗
   - [x] JSON 报告解析

2. **Placeholder scan:** 无 TBD/TODO

3. **Type consistency:** 使用原生 JavaScript，无类型问题

---

## Plan Complete

计划已完成，保存在 `docs/superpowers/plans/2026-04-06-html-report-viewer.md`。

**这个任务比较简单，是单文件 HTML 实现，不使用 TDD 流程，直接实现即可。**
