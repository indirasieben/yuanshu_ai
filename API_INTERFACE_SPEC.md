# 元枢 AI 前端接口清单

> 本文档列出前端所有 API 调用，供后端开发对接参考。
>
> 前端基于 **new-api**（https://github.com/Calcium-Ion/new-api）的接口规范开发，后端可直接部署 new-api 或自行实现以下接口。

---

## 一、全局约定

### 1.1 Base URL 配置

```js
// src/lib/config.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
```

- 开发环境：通过 Vite proxy 转发（需配置 `vite.config.js`）
- 生产环境：通过 `VITE_API_BASE_URL` 环境变量指定后端地址；若留空则前后端同域

### 1.2 认证方式

前端使用**两种认证方式**：

| 认证方式 | 适用端点 | Header |
|---------|---------|--------|
| Session Token | `/api/*` 管理接口 | `Authorization: Bearer <session_token>` |
| API Token（relay key） | `/v1/*` AI 中继接口 | `Authorization: Bearer <api_token>` |

- **Session Token**：登录接口返回 JWT，存储在 localStorage `auth-storage` → `state.sessionToken`
- **API Token**：前端自动调用 `POST /api/token/` 创建一个内部 relay key，存储在 `state.apiToken`

### 1.3 通用响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误描述"
}
```

---

## 二、用户认证接口（/api/user/）

### 2.1 用户注册

```
POST /api/user/register
```

**请求体：**
```json
{
  "username": "reviewer",
  "password": "Test@2026",
  "email": "reviewer@metahub-ai.com"
}
```

**成功响应：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": "<jwt_token>"
}
```

**前端调用位置：** `src/stores/authStore.js:32`

---

### 2.2 用户登录

```
POST /api/user/login
```

**请求体：**
```json
{
  "username": "reviewer",
  "password": "Test@2026"
}
```

**成功响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": "<jwt_token>"
}
```

**前端处理：** 将 `data` 值存为 `sessionToken`，然后调用 `GET /api/user/self` 获取用户信息。

**前端调用位置：** `src/stores/authStore.js:17`

---

### 2.3 获取当前用户信息

```
GET /api/user/self
Authorization: Bearer <session_token>
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "reviewer",
    "email": "reviewer@metahub-ai.com",
    "display_name": "Reviewer",
    "role": 1,
    "status": 1,
    "quota": 500000,
    "used_quota": 12345,
    "request_count": 42,
    "github_id": "",
    "oidc_id": "",
    "aff_code": "FUSION-ABC12",
    "invite_count": 0
  }
}
```

**前端使用的字段：**
- `display_name` / `username` — 显示用户名
- `email` — 显示邮箱
- `quota` — 剩余额度（除以 500000 换算为美元显示）
- `used_quota` — 已用额度
- `request_count` — 请求次数
- `github_id` / `oidc_id` — 判断已绑定的登录方式
- `aff_code` — 推荐码
- `invite_count` — 已邀请人数

**前端调用位置：** `src/stores/authStore.js:48`

---

### 2.4 更新用户信息

```
PUT /api/user/self
Authorization: Bearer <session_token>
```

**请求体：**
```json
{
  "display_name": "新名称"
}
```

**前端调用位置：** `src/stores/authStore.js:90`

---

### 2.5 发送邮箱验证码

```
GET /api/verification?email=user@example.com&turnstile=
```

**前端调用位置：** `src/pages/ResetPasswordPage.jsx:19`

---

### 2.6 重置密码

```
POST /api/user/reset
```

**请求体：**
```json
{
  "email": "user@example.com",
  "verification_code": "123456",
  "password": "newPassword123"
}
```

**前端调用位置：** `src/pages/ResetPasswordPage.jsx:43`

---

### 2.7 Google OAuth 登录

```
GET /api/oauth/oidc
```

前端通过 `window.location.href` 跳转到此地址，由后端处理 OAuth 流程。登录成功后后端重定向回前端，URL 中携带 `?token=<jwt_token>`。

**前端处理：** `src/App.jsx:34` 中解析 URL 参数。

---

## 三、API Token 管理接口（/api/token/）

### 3.1 获取 Token 列表

```
GET /api/token/?p=0&size=10
Authorization: Bearer <session_token>
```

**成功响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Production Key",
      "key": "sk-xxxxxxxxxxxxxxxx",
      "created_time": 1710000000,
      "expired_time": -1,
      "remain_quota": 500000,
      "unlimited_quota": false,
      "model_limits_enabled": false,
      "status": 1
    }
  ]
}
```

**前端调用位置：**
- `src/stores/authStore.js:64`（启动时获取内部 token）
- `src/pages/ApiKeysPage.jsx:21`（API Key 管理页列表）

---

### 3.2 创建 Token

```
POST /api/token/
Authorization: Bearer <session_token>
```

**请求体：**
```json
{
  "name": "My API Key",
  "remain_quota": 0,
  "expired_time": -1,
  "unlimited_quota": true,
  "model_limits_enabled": false
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

> 注意：完整 key 仅在创建时返回一次，后续查询只返回脱敏版本。

**前端调用位置：**
- `src/stores/authStore.js:75`（自动创建内部 relay key）
- `src/pages/ApiKeysPage.jsx:43`（用户手动创建）

---

### 3.3 删除 Token

```
DELETE /api/token/{id}
Authorization: Bearer <session_token>
```

**前端调用位置：** `src/pages/ApiKeysPage.jsx:69`

---

## 四、AI 中继接口（/v1/）

### 4.1 获取模型列表

```
GET /v1/models
Authorization: Bearer <api_token>
```

**成功响应（OpenAI 兼容格式）：**
```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-4-sonnet",
      "object": "model",
      "created": 1710000000,
      "owned_by": "anthropic"
    },
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1710000000,
      "owned_by": "openai"
    }
  ]
}
```

**前端调用位置：** `src/stores/modelStore.js:33`

---

### 4.2 流式对话（SSE）

```
POST /v1/chat/completions
Authorization: Bearer <api_token>
Content-Type: application/json
```

**请求体：**
```json
{
  "model": "claude-4-sonnet",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "你好" }
  ],
  "stream": true,
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 4096
}
```

**响应格式：** Server-Sent Events (SSE)

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"你"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"好"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}

data: [DONE]
```

**前端处理：** `src/lib/stream.js` 解析 SSE 流，逐字渲染到界面。

**前端调用位置：** `src/lib/stream.js:52`（流式）、`src/lib/stream.js:133`（非流式备用）

---

## 五、接口汇总表

| 方法 | 端点 | 认证方式 | 用途 | 前端位置 |
|------|------|---------|------|---------|
| POST | `/api/user/register` | 无 | 注册 | authStore |
| POST | `/api/user/login` | 无 | 登录 | authStore |
| GET | `/api/user/self` | Session | 获取用户信息 | authStore |
| PUT | `/api/user/self` | Session | 更新个人信息 | authStore |
| GET | `/api/verification?email=x` | 无 | 发送验证码 | ResetPasswordPage |
| POST | `/api/user/reset` | 无 | 重置密码 | ResetPasswordPage |
| GET | `/api/oauth/oidc` | 无 | Google OAuth | App.jsx |
| GET | `/api/token/` | Session | Token 列表 | authStore, ApiKeysPage |
| POST | `/api/token/` | Session | 创建 Token | authStore, ApiKeysPage |
| DELETE | `/api/token/{id}` | Session | 删除 Token | ApiKeysPage |
| GET | `/v1/models` | API Token | 模型列表 | modelStore |
| POST | `/v1/chat/completions` | API Token | 流式对话 | stream.js |

---

## 六、部署配置说明

### 6.1 环境变量

前端构建时可通过以下环境变量配置：

```bash
# 后端 API 地址（如果前后端不同域）
VITE_API_BASE_URL=https://your-backend-domain.com
```

如果前后端同域部署（如后端同时提供静态文件和 API），可留空。

### 6.2 推荐的后端方案

本前端按照 **new-api**（https://github.com/Calcium-Ion/new-api）的接口规范开发。new-api 是一个开源的 AI 模型中继管理平台，支持：

- 多模型聚合（OpenAI / Anthropic / Google / DeepSeek 等）
- 用户管理、Token 管理、用量统计
- OpenAI 兼容 API 格式
- 流式输出（SSE）

后端开发可以：
1. **直接部署 new-api**：Docker 一键部署，开箱即用
2. **自行实现上述接口**：按照本文档的接口规范实现

### 6.3 前端构建

```bash
cd fusion-ai-v2
npm install
npm run build    # 产物在 dist/ 目录
```

### 6.4 技术栈

- React 19 + React Router 7（HashRouter）
- Vite 7.3
- Tailwind CSS 4.2
- Zustand 5（状态管理，localStorage 持久化）
- lucide-react（图标）
- react-hot-toast（通知）
- react-markdown + remark-gfm + rehype-highlight（Markdown 渲染）
