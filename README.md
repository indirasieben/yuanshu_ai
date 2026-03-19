# 元枢 AI — AI 模型聚合平台

面向香港及大中华区用户的 AI 模型聚合平台，聚合 OpenAI、Anthropic、Google、DeepSeek 等主流模型。

## 访问地址

- **前端**：https://bvideo-2gq45mwwedba5800-1251544676.tcloudbaseapp.com/
- **后端管理**：部署 new-api 后通过云托管地址访问

## 技术架构

```
用户浏览器
    │
    ├── 前端 (React + Vite + Tailwind CSS)
    │   └── 部署在 CloudBase 静态网站托管
    │
    └── 后端 (new-api)
        └── 部署在 CloudBase 云托管 (容器型)
            ├── /v1/chat/completions  ← 流式对话 (SSE)
            ├── /v1/models            ← 模型列表
            └── /api/*                ← 用户管理
```

## 项目结构

```
fusion-ai-v2/
├── src/
│   ├── App.jsx                  # 路由 + OAuth 回调处理
│   ├── main.jsx                 # 入口 (HashRouter)
│   ├── index.css                # Tailwind 主题 + 自定义样式
│   ├── lib/
│   │   ├── config.js            # API 地址、默认配置
│   │   ├── api.js               # 管理 API 客户端
│   │   ├── stream.js            # SSE 流式输出
│   │   └── export.js            # 对话导出 (Markdown)
│   ├── stores/
│   │   ├── authStore.js         # 登录态、用户信息
│   │   ├── chatStore.js         # 对话列表、消息、流式
│   │   ├── modelStore.js        # 模型列表、常用模型
│   │   └── settingsStore.js     # 主题、语言偏好
│   ├── data/
│   │   ├── modelMeta.js         # 模型元数据
│   │   ├── models.js            # 模型列表 (旧)
│   │   └── plans.js             # 定价方案
│   ├── pages/
│   │   ├── LandingPage.jsx      # 首页
│   │   ├── PricingPage.jsx      # 定价页
│   │   ├── LoginPage.jsx        # 登录
│   │   ├── RegisterPage.jsx     # 注册
│   │   ├── ResetPasswordPage.jsx# 找回密码
│   │   ├── ChatPage.jsx         # 对话主界面
│   │   ├── ModelListPage.jsx    # 模型列表
│   │   └── AccountPage.jsx      # 账号管理
│   └── components/
│       ├── auth/ProtectedRoute.jsx
│       ├── chat/ (Sidebar, ChatArea, InputArea, MessageBubble, ModelSelector, EmptyState, ConversationSettingsModal)
│       ├── layout/ (Navbar, Footer)
│       ├── landing/ (Hero, Features, ModelShowcase, PricingPreview)
│       └── pricing/ (PricingCards, ComparisonTable, FAQ)
├── .env                         # 开发环境配置
├── .env.production              # 生产环境配置
├── cloudbaserc.json             # CloudBase 配置
├── vite.config.js               # Vite 配置 (dev proxy)
└── package.json
```

## 云开发资源

| 资源类型 | 资源名称 | 说明 |
|---------|---------|------|
| 环境 ID | `bvideo-2gq45mwwedba5800` | 上海区域 |
| 静态托管 | `tcloudbaseapp.com` | 前端部署 |
| 云托管 | `new-api` (待部署) | new-api 后端 |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (需要本地或远程 new-api 后端)
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 配置后端地址

### 开发环境
编辑 `vite.config.js` 中的 proxy target，或设置 `VITE_API_BASE_URL` 环境变量。

### 生产环境
编辑 `.env.production` 中的 `VITE_API_BASE_URL`，设置为 new-api 云托管的实际地址。

## MVP 功能清单

- [x] Landing 首页 + 定价页
- [x] 邮箱+密码 注册/登录
- [x] Google OAuth 登录
- [x] 找回密码（邮箱验证码）
- [x] 多模型流式对话 (SSE)
- [x] 对话管理（新建/重命名/删除/搜索）
- [x] 对话设置（System Prompt / Temperature / TopP / MaxTokens）
- [x] 自动生成对话标题
- [x] 模型列表（按厂商分组/搜索/常用模型）
- [x] 对话历史 localStorage 持久化
- [x] 对话导出 (Markdown)
- [x] 账号管理（个人信息/偏好设置/安全设置/用量统计）
