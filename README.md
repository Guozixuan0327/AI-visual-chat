# AI 视觉对话助手

> "AI不持续盯着摄像头，只在用户主动说话时抓取一次当前画面，并通过成本面板可视化'看/听'的开销。"

一款基于 Web 的多模态 AI 对话实验应用。核心实验命题：**按需发送图像（事件驱动）vs 持续发送（1fps）**，量化成本差异。

## 架构

```
┌─ 浏览器 ─────────────────────┐      ┌─ Express 后端 ──┐      ┌─ 阿里云 ──┐
│  React + Vite + Zustand      │      │  route/controller │      │  Qwen-VL  │
│  Web Speech API (ASR/TTS)    │ ───→ │  /service/schema  │ ───→ │  DashScope │
│  getUserMedia (摄像头)        │ ←─── │  Zod + JSON log   │ ←─── │  API      │
│  帧采样 + 节流（端侧）         │      └──────────────────┘      └───────────┘
└──────────────────────────────┘
```

## 已实现用户故事

| ID | 用户故事 | 状态 |
|----|---------|------|
| US1 | 摄像头预览与帧抓取 | ✅ |
| US2 | 按住说话 → 语音识別转文字 | ✅ |
| US3 | 单轮多模态对话（文本+图像→AI回复） | ✅ |
| US4 | TTS 语音播报 AI 回复 | ✅ |
| US5 | 多轮对话上下文管理 | ✅ |
| US6 | 帧节流/变化检测（按需发送） | ✅ D2 |
| US7 | 成本面板（实时累积统计） | ✅ D2 |
| US8 | 方案A/B 对比面板 | ✅ D2 |
| US9 | 实验数据埋点与导出 | ✅ D2 |
| US10 | 流式输出 + 分句TTS | ⬜ D3 |

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 8
- Zustand（状态管理）
- CSS Modules
- 浏览器原生 API：Web Speech API (SpeechRecognition / SpeechSynthesis)、getUserMedia

### 后端
- Node.js + Express
- TypeScript
- Zod（请求校验）
- 通义千问 Qwen-VL（DashScope API）
- 原生 fetch（无第三方 HTTP 库）
- 简单 JSON 结构化日志（stdout/stderr）

## 快速开始

### 1. 配置后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入阿里云 API 密钥
```

```env
PORT=3001
DASHSCOPE_API_KEY=your_dashscope_api_key
QWEN_VL_MODEL=qwen-vl-max
QWEN_VL_API_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
```

### 2. 启动后端

```bash
cd backend
npm install
npm run dev          # → http://localhost:3001
```

### 3. 配置前端

```bash
cd frontend
cp .env.example .env        # VITE_API_BASE_URL=/api（Vite 代理到后端）
```
> 如果忘记这步，前端发请求会 404，因为不知道后端在哪。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

### 5. 使用

1. 浏览器打开 `http://localhost:5173`
2. 允许摄像头和麦克风权限
3. 按住 🎤 按钮说话 → 松手后语音识别文字填入输入框，同时截取当前帧暂存
4. 点击"发送"按钮或回车 → 文字 + 暂存帧一起发送给 Qwen-VL → AI 文字回复 + TTS 播报

## API 文档

### POST /api/chat

**请求体：**
```json
{
  "system": "你是一个友好、口语化的视觉助手...",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "..." } },
        { "type": "text", "text": "这是什么？" }
      ]
    }
  ],
  "stream": false
}
```

**响应：**
```json
{
  "content": [{ "type": "text", "text": "这是一张..." }],
  "usage": { "input_tokens": 150, "output_tokens": 50 },
  "processingTime": 1234
}
```

### GET /api/health

```json
{ "status": "ok", "timestamp": "2026-06-13T..." }
```

## 项目结构

```
├── frontend/ (Vite + React)
│   └── src/
│       ├── components/
│       │   ├── CameraView/       # 摄像头预览 (forwardRef)
│       │   ├── ChatInterface/    # 对话气泡 + PTT (按住说话)
│       │   ├── Controls/         # 设置面板
│       │   ├── CostPanel/        # 成本面板
│       │   ├── ComparisonPanel/  # 方案A/B对比
│       │   ├── ExportPanel/      # 实验数据导出
│       │   └── Layout/           # 布局
│       ├── hooks/
│       │   ├── useCamera.ts
│       │   ├── useFrameCapture.ts  # 多帧采样队列 + 最佳帧选择
│       │   ├── useSpeechRecognition.ts
│       │   ├── useTTS.ts           # TTS 语音播报
│       │   ├── useChat.ts          # 对话编排 (含 cost/experiment 埋点)
│       │   └── useMicrophone.ts
│       ├── lib/
│       │   ├── frameThrottle.ts    # 帧节流纯函数
│       │   └── costEstimator.ts    # token/费用估算纯函数
│       ├── store/                  # Zustand (chat/cost/settings/media/experiment)
│       ├── config/
│       │   ├── prompt.ts         # system prompt
│       │   └── constants/
│       ├── services/
│       │   └── api.ts            # 后端 API 调用
│       └── utils/
│
├── backend/ (Express)
│   └── src/
│       ├── routes/               # chat.routes.ts
│       ├── controllers/          # chat.controller.ts, health.controller.ts
│       ├── services/
│       │   ├── qwen.service.ts   # Qwen-VL DashScope API
│       │   └── chatService.ts    # 编排层
│       ├── schemas/              # Zod schemas (chat.schema.ts)
│       ├── middleware/           # CORS, rate-limit
│       ├── config/               # environment.ts (Zod env parsing)
│       └── utils/                # logger.ts, errorHandler.ts
│
├── README.md                     # 本文档
└── DESIGN.md                     # 设计文档与实验说明
```

## 依赖说明

### 前端
- 框架：React + Vite（项目基础设施）
- 状态管理：Zustand + zustand/middleware (persist)
- UUID 生成：uuid v9
- 语音识别/合成：浏览器原生 Web Speech API，**未引入任何第三方语音库**
- HTTP：原生 fetch，**未使用 axios 请求**

### 后端
- Express
- cors, helmet, express-rate-limit
- Zod（请求参数校验与环境变量解析）
- dotenv
- 调用通义千问 DashScope API，通过原生 fetch，**未使用官方 SDK**

### 原创说明
- `lib/frameThrottle.ts`、`lib/costEstimator.ts`、`store/costStore.ts`、`store/experimentStore.ts`、`components/ComparisonPanel/`、`components/CostPanel/` 为本项目核心原创模块，非复用任何模板代码。
- `services/qwen.service.ts`、`schemas/chat.schema.ts`、`utils/logger.ts`、`utils/errorHandler.ts` 为本项目后端核心原创模块。
- `config/prompt.ts`、`hooks/useTTS.ts`、`hooks/useFrameCapture.ts`（多帧采样队列）为本项目前端原创模块。

## 环境变量

### 后端 (.env)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3001 |
| NODE_ENV | 运行环境 | development |
| DASHSCOPE_API_KEY | 阿里云 DashScope API Key | (必填) |
| QWEN_VL_MODEL | 模型名称 | qwen-vl-max |
| QWEN_VL_API_ENDPOINT | API 地址 | https://dashscope.aliyuncs.com/... |
| CORS_ORIGIN | 允许的前端源 | http://localhost:5173 |
| RATE_LIMIT_WINDOW_MS | 限流窗口 | 60000 |
| RATE_LIMIT_MAX_REQUESTS | 窗口内最大请求数 | 30 |
| LOG_LEVEL | 日志级别 | info |

## 实验数据

> 数据来源：实际运行 3 轮对话后导出的 `experiment_data.json`  
> 分析文档：`../experiment_analysis.md`

### 原始数据

| # | 延迟(ms) | 已发图片 | 图片Token | 文本Token | 费用(USD) |
|---|----------|----------|-----------|-----------|-----------|
| 1 | 1,647 | ✅ | 103 | 0* | 0* |
| 2 | 2,268 | ✅ | 103 | 0* | 0* |
| 3 | 5,150 | ✅ | 103 | 0* | 0* |

> *`textTokens` 和 `totalCostUSD` 曾因前端埋点 bug 硬编码为 0，已于 2026-06-14 修复，修复后数据将正确记录。

### 延迟分析

| 指标 | 值 |
|------|-----|
| 平均延迟 | 3,022 ms |
| 最小延迟 | 1,647 ms |
| 最大延迟 | 5,150 ms |

### 成本对比

| 方案 | 图片数 | 估算图片 Token | 估算费用 |
|------|--------|---------------|---------|
| 方案A（持续发送 1fps） | ~801 张 | ~82,467 | ~$0.034 |
| 方案B（按需发送） | 3 张 | 309 | ~$0.00013 |
| **节省** | **-99.6%** | — | **~260×** |

定价基准：Qwen-VL-Max 输入 $0.41/1M tokens

## 浏览器兼容性

| 功能 | Chrome | Edge | Safari | Firefox |
|------|--------|------|--------|---------|
| 摄像头 | ✅ | ✅ | ✅ | ✅ |
| 语音识别 | ✅ | ✅ | ⚠️ 15+ | ❌ |
| TTS 播报 | ✅ | ✅ | ✅ | ✅ |

> 语音识别需要 Chrome/Edge（或 Safari 15+），必须在 HTTPS 或 localhost 下使用。

## 许可证

MIT
