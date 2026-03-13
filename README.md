# Dashboard Designer — Community Edition / 可视化大屏设计器 — 社区版

<p align="center">
  <strong>An AI-powered visual dashboard design platform (Community Edition)</strong><br/>
  <strong>AI 驱动的可视化数据大屏设计平台（社区版）</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/AI-powered-ff6b6b?logo=anthropic&logoColor=white" alt="AI Powered" />
  <img src="https://img.shields.io/badge/ECharts-6-aa344d?logo=apacheecharts&logoColor=white" alt="ECharts 6" />
  <img src="https://img.shields.io/badge/license-AGPLv3-blue" alt="License" />
</p>

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

---

<a id="english"></a>

## English

### Overview

Dashboard Designer is a web-based visual dashboard (data screen) design platform. Users can create stunning data visualization dashboards through drag-and-drop, configure real-time data sources, leverage AI to automatically generate layouts from screenshots, and export deployable standalone pages.

### Key Features

#### Visual Canvas Editor
- **Drag & Drop Canvas** — Default 1920x1080 canvas with customizable dimensions, supporting color/gradient/image backgrounds
- **Component Library** — 22 built-in widget types across 9 categories (charts, stats, tables, text, media, maps, gauges, decorations, utility)
- **Smart Editing** — Multi-select, group/ungroup, alignment guides, snap-to-grid, rulers, and minimap navigation
- **Transform Controls** — Move, resize, rotate components with visual handles; shift-key for aspect ratio lock and 15-degree snap
- **Layer Management** — Z-index ordering, bring-to-front/send-to-back, layer panel with visibility and lock toggles
- **Undo/Redo** — Full history system with configurable depth (Ctrl+Z / Ctrl+Y)
- **Keyboard Shortcuts** — Complete shortcut support: copy/paste, duplicate, delete, select-all, arrow-key nudge, and more
- **Viewport Culling** — Performance optimization that only renders visible components on large dashboards

#### 22 Built-in Widgets

| Category | Widgets |
|----------|---------|
| **Charts** | Bar Chart, Line Chart, Pie Chart, Gauge |
| **Stats** | Stat Card, Number Flipper, Progress Bar, Progress Ring |
| **Tables** | Basic Table, Scrolling Table, Ranking List |
| **Text** | Title, Text Block, Scrolling Text (Marquee) |
| **Media** | Image, Video |
| **Maps** | China Map |
| **Decorations** | Border Decoration, Divider, Glow Dot |
| **Utility** | Clock |

Each widget supports extensive property customization via the Property Panel, with schema-driven auto-generated UI controls (color pickers, sliders, toggles, JSON editors, etc.).

#### AI-Powered Design

- **Image-to-Dashboard** — Upload a screenshot or mockup image, and AI (Claude / GPT-4o / Gemini) will analyze and automatically generate matching components on the canvas
- **AI Chat Assistant** (Ctrl+K) — Context-aware design assistant that can add/modify/remove components, suggest layouts, review designs, recommend chart types, and generate color schemes
- **Design Review** — AI-powered analysis with scoring and severity-based suggestions (error/warning/info)
- **Smart Recommendations** — Chart type optimization based on your data characteristics

#### Data Source System

- **Static Data** — Inline JSON data editor with real-time preview
- **API Data** — HTTP GET/POST endpoints with configurable polling intervals, headers, and parameters
- **WebSocket** — Real-time streaming data connections
- **Data Binding** — Bind any data source to any component; data automatically flows into widget props
- **Transform** — JavaScript expressions or JSONPath to transform fetched data before binding

#### Export & Preview

- **Live Preview** — Full-screen preview with adaptive DPI scaling, multi-resolution presets (1080p / 2K / 4K)
- **Auto-Carousel** — For tall dashboards, auto-paginate with configurable intervals (5s~60s) and keyboard navigation
- **HTML Export** — Self-contained single HTML file; supports static (offline) and dynamic (with live API polling) modes
- **Image Export** — Export as PNG or JPEG with configurable scale
- **PDF Export** — Server-side rendering via headless browser
- **Embed Code** — Generate iframe embed snippets and shareable links

#### Project Management

- **CRUD** — Create, list, open, duplicate, rename, and delete projects
- **Version Control** — Snapshot versions with messages; restore to any previous version
- **Auto-Save** — Real-time save status indicator (saved/saving/unsaved/error)
- **Local Persistence** — Automatic localStorage backup for crash recovery

#### Alarm System

- **Threshold Rules** — Configure comparison operators (>, >=, <, <=, ==, !=) on data source field paths
- **Visual Effects** — Flash (blinking border), Highlight (solid border), Shake (animation), Sound (audio alert)
- **Component Linking** — Bind alarm rules to specific widgets for targeted visual alerts

#### Authentication

- **Email/Password** — Credentials-based login with auto-registration
- **OAuth 2.0** — GitHub and Google sign-in
- **Session Management** — JWT-based sessions via NextAuth.js v5

#### Internationalization (i18n)

- **Languages** — English and Chinese (Simplified) with full UI coverage
- **Cookie-Based** — Locale preference persisted via cookie; instant switching without page reload

#### Progressive Web App (PWA)

- **Offline Support** — Service worker with cache-first strategy for static assets
- **Installable** — Web app manifest for "Add to Home Screen" on mobile and desktop
- **Auto-Update** — Automatic cache cleanup and version management

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) + TypeScript (strict) |
| **Styling** | Tailwind CSS v4 + Shadcn/ui |
| **State** | Zustand + Immer (editor store + UI store separation) |
| **Validation** | Zod v4 (shared across AI, API, forms) |
| **Charts** | ECharts 6 (lazy loaded per chart type) |
| **Animation** | Framer Motion |
| **Database** | SQLite (better-sqlite3) / PostgreSQL + Prisma v7 ORM |
| **Auth** | NextAuth.js v5 (Credentials + GitHub + Google) |
| **AI** | Anthropic Claude API (Vision + Tool Use) |
| **i18n** | next-intl |
| **Testing** | Vitest + Testing Library |
| **Linting** | ESLint + Prettier + Husky + lint-staged |

### Project Structure

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── api/              # REST API (projects, data sources, AI, export)
│   ├── auth/             # Sign-in and registration pages
│   ├── dashboard/        # Project management hub
│   ├── editor/           # Main visual editor page
│   ├── preview/          # Full-screen dashboard preview
│   └── templates/        # Template gallery
├── components/
│   ├── editor/           # Editor UI (Canvas, Toolbar, Panels, Chat)
│   ├── widgets/          # 22 dashboard visualization components
│   └── ui/               # Shared UI components (Shadcn/ui based)
├── stores/               # Zustand stores (editorStore + uiStore)
├── schemas/              # Zod schemas (shared validation)
├── hooks/                # Custom React hooks
├── lib/                  # Utilities, AI logic, export logic, alarms
├── i18n/                 # Internationalization config
├── __tests__/            # Unit tests (mirrors src structure)
├── prisma/               # Database schema + migrations
└── messages/             # i18n translation files (en.json, zh.json)
```

### Getting Started

#### Prerequisites

- Node.js 20+
- npm or pnpm

#### Installation

```bash
# Clone the repository
git clone https://github.com/tinyvane/UIDesigner.git
cd UIDesigner

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema (creates local SQLite dev.db)
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Environment Variables

Create a `.env` file in the project root:

```env
# Auth (required)
AUTH_SECRET=your-random-secret-here

# OAuth providers (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI provider (optional, for AI features)
ANTHROPIC_API_KEY=your-claude-api-key
```

### Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript type check
npm run test         # Run Vitest unit tests
npm run test:watch   # Run tests in watch mode
npm run db:generate  # Generate Prisma client
npm run db:push      # Push Prisma schema to database
npm run db:studio    # Open Prisma Studio (GUI)
npm run db:seed      # Seed database with templates
npm run format       # Prettier format all files
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select mode |
| `Space` + Drag | Pan canvas |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+D` | Duplicate |
| `Ctrl+A` | Select all |
| `Ctrl+S` | Save project |
| `Ctrl+P` | Preview |
| `Ctrl+K` | Open AI Chat |
| `Delete` / `Backspace` | Delete selected |
| `Arrow Keys` | Nudge 1px (+ Shift: 10px) |
| `Scroll Wheel` | Zoom in/out |

### License

This project is licensed under the [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html).

- **Community Edition**: Free and open-source, ideal for individual developers and learning purposes
- **Professional Edition**: Designed for teams and enterprises with advanced needs, offering additional features and commercial licensing

> 💡 If you are an enterprise user and would like to use UIDesigner in the future without disclosing your source code, we will offer a commercial license plan. Feel free to contact us in advance for more details.

### 📬 Contact Us

If you have any licensing-related questions, feel free to reach out:

- 📧 Email: [40579925@qq.com](mailto:40579925@qq.com)
- 💬 Issues: [GitHub Issues](https://github.com/tinyvane/UIDesigner/issues)

---

> ⚠️ Third-party dependencies in this project may use different open-source licenses. Please refer to each dependency's license information.

---

<a id="中文"></a>

## 中文

### 概述

Dashboard Designer 是一个基于 Web 的可视化数据大屏设计平台。用户可以通过拖拽方式创建精美的数据可视化大屏，配置实时数据源，利用 AI 从截图自动生成布局，并导出可独立部署的页面。

### 核心功能

#### 可视化画布编辑器
- **拖拽式画布** — 默认 1920x1080 画布，支持自定义尺寸，支持纯色/渐变/图片背景
- **组件库** — 内置 22 种组件，涵盖 9 大类别（图表、统计、表格、文本、媒体、地图、仪表盘、装饰、工具）
- **智能编辑** — 多选、编组/解组、对齐参考线、网格吸附、标尺、小地图导航
- **变换控制** — 移动、缩放、旋转组件，支持 Shift 键锁定比例和 15 度角度吸附
- **图层管理** — Z 轴排序、置顶/置底、图层面板支持可见性和锁定切换
- **撤销/重做** — 完整历史记录系统，可配置深度（Ctrl+Z / Ctrl+Y）
- **快捷键** — 全面的快捷键支持：复制/粘贴、复制、删除、全选、方向键微调等
- **视口裁剪** — 大型大屏的性能优化，仅渲染可见区域内的组件

#### 22 种内置组件

| 类别 | 组件 |
|------|------|
| **图表** | 柱状图、折线图、饼图、仪表盘 |
| **统计** | 统计卡片、数字翻牌器、进度条、环形进度 |
| **表格** | 基础表格、滚动表格、排行榜 |
| **文本** | 标题、文本段落、滚动文字（跑马灯） |
| **媒体** | 图片、视频 |
| **地图** | 中国地图 |
| **装饰** | 边框装饰、分割线、发光点 |
| **工具** | 时钟 |

每个组件都支持通过属性面板进行丰富的属性自定义，属性面板基于 Schema 自动生成 UI 控件（取色器、滑块、开关、JSON 编辑器等）。

#### AI 驱动的设计

- **截图转大屏** — 上传截图或设计稿图片，AI（Claude / GPT-4o / Gemini）将自动分析并在画布上生成匹配的组件
- **AI 聊天助手**（Ctrl+K）— 上下文感知的设计助手，可添加/修改/删除组件、建议布局、审查设计、推荐图表类型、生成配色方案
- **设计审查** — AI 驱动的分析评分，按严重程度分级建议（错误/警告/信息）
- **智能推荐** — 根据数据特征优化图表类型选择

#### 数据源系统

- **静态数据** — 内联 JSON 数据编辑器，实时预览
- **API 数据** — HTTP GET/POST 端点，支持可配置的轮询间隔、请求头和参数
- **WebSocket** — 实时流式数据连接
- **数据绑定** — 将任意数据源绑定到任意组件，数据自动流入组件属性
- **数据转换** — 支持 JavaScript 表达式或 JSONPath 对获取的数据进行转换

#### 导出与预览

- **实时预览** — 全屏预览，自适应 DPI 缩放，多分辨率预设（1080p / 2K / 4K）
- **自动轮播** — 对于长页面大屏，支持自动分页轮播，可配置间隔（5秒~60秒），支持键盘导航
- **HTML 导出** — 自包含单 HTML 文件；支持静态（离线可用）和动态（实时 API 轮询）两种模式
- **图片导出** — 导出为 PNG 或 JPEG，支持自定义缩放比例
- **PDF 导出** — 通过无头浏览器进行服务端渲染
- **嵌入代码** — 生成 iframe 嵌入代码片段和可分享链接

#### 项目管理

- **增删改查** — 创建、列表、打开、复制、重命名和删除项目
- **版本控制** — 带备注的版本快照；可恢复到任意历史版本
- **自动保存** — 实时保存状态指示器（已保存/保存中/未保存/错误）
- **本地持久化** — 自动 localStorage 备份，防止数据丢失

#### 告警系统

- **阈值规则** — 配置比较运算符（>, >=, <, <=, ==, !=）监控数据源字段路径
- **视觉效果** — 闪烁（边框闪烁）、高亮（实色边框）、抖动（动画）、声音（音频提醒）
- **组件关联** — 将告警规则绑定到特定组件，实现定向视觉告警

#### 用户认证

- **邮箱/密码** — 基于凭据的登录，支持自动注册
- **OAuth 2.0** — GitHub 和 Google 第三方登录
- **会话管理** — 基于 JWT 的会话，通过 NextAuth.js v5 实现

#### 国际化 (i18n)

- **语言支持** — 英文和简体中文，覆盖完整 UI
- **Cookie 存储** — 语言偏好通过 Cookie 持久化，无需刷新页面即可切换

#### 渐进式 Web 应用 (PWA)

- **离线支持** — Service Worker 缓存策略，静态资源优先使用缓存
- **可安装** — Web App Manifest 支持「添加到主屏幕」
- **自动更新** — 自动缓存清理和版本管理

### 技术栈

| 层级 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) + TypeScript (严格模式) |
| **样式** | Tailwind CSS v4 + Shadcn/ui |
| **状态管理** | Zustand + Immer（编辑器 Store + UI Store 分离） |
| **数据校验** | Zod v4（AI、API、表单共享校验） |
| **图表** | ECharts 6（按图表类型懒加载） |
| **动画** | Framer Motion |
| **数据库** | SQLite (better-sqlite3) / PostgreSQL + Prisma v7 ORM |
| **认证** | NextAuth.js v5（凭据 + GitHub + Google） |
| **AI** | Anthropic Claude API（视觉 + 工具调用） |
| **国际化** | next-intl |
| **测试** | Vitest + Testing Library |
| **代码规范** | ESLint + Prettier + Husky + lint-staged |

### 项目结构

```
src/
├── app/                  # Next.js App Router 页面 + API 路由
│   ├── api/              # REST API（项目、数据源、AI、导出）
│   ├── auth/             # 登录和注册页面
│   ├── dashboard/        # 项目管理中心
│   ├── editor/           # 主可视化编辑器页面
│   ├── preview/          # 全屏大屏预览
│   └── templates/        # 模板库
├── components/
│   ├── editor/           # 编辑器 UI（画布、工具栏、面板、聊天）
│   ├── widgets/          # 22 个数据可视化组件
│   └── ui/               # 共享 UI 组件（基于 Shadcn/ui）
├── stores/               # Zustand 状态管理（editorStore + uiStore）
├── schemas/              # Zod 校验 Schema
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数、AI 逻辑、导出逻辑、告警
├── i18n/                 # 国际化配置
├── __tests__/            # 单元测试（镜像 src 结构）
├── prisma/               # 数据库 Schema + 迁移
└── messages/             # i18n 翻译文件（en.json, zh.json）
```

### 快速开始

#### 环境要求

- Node.js 20+
- npm 或 pnpm

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/tinyvane/UIDesigner.git
cd UIDesigner

# 安装依赖
npm install

# 生成 Prisma 客户端
npm run db:generate

# 推送数据库 Schema（创建本地 SQLite dev.db）
npm run db:push

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

#### 环境变量

在项目根目录创建 `.env` 文件：

```env
# 认证（必需）
AUTH_SECRET=你的随机密钥

# OAuth 提供者（可选）
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI 提供者（可选，用于 AI 功能）
ANTHROPIC_API_KEY=你的Claude-API-Key
```

### 常用命令

```bash
npm run dev          # 启动开发服务器（端口 3000）
npm run build        # 生产环境构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复
npm run type-check   # TypeScript 类型检查
npm run test         # 运行 Vitest 单元测试
npm run test:watch   # 测试监听模式
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送 Prisma Schema 到数据库
npm run db:studio    # 打开 Prisma Studio（可视化界面）
npm run db:seed      # 数据库种子数据（模板）
npm run format       # Prettier 格式化所有文件
```

### 快捷键

| 快捷键 | 操作 |
|--------|------|
| `V` | 选择模式 |
| `Space` + 拖拽 | 平移画布 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` / `Ctrl+Shift+Z` | 重做 |
| `Ctrl+C` | 复制 |
| `Ctrl+V` | 粘贴 |
| `Ctrl+D` | 复制组件 |
| `Ctrl+A` | 全选 |
| `Ctrl+S` | 保存项目 |
| `Ctrl+P` | 预览 |
| `Ctrl+K` | 打开 AI 聊天 |
| `Delete` / `Backspace` | 删除选中 |
| `方向键` | 微调 1px（+ Shift：10px） |
| `滚轮` | 缩放 |

### 许可

本项目基于 [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html) 协议开源。

- **社区版**：保持开源免费，适合个人开发者和学习使用
- **专业版**：面向有更多需求的团队和企业，提供额外功能和商业许可

> 💡 如果你是企业用户，未来希望在不公开源代码的情况下使用 UIDesigner，我们将提供商业许可方案，欢迎提前联系我们了解详情。

### 📬 联系我们

如有许可相关的疑问，欢迎通过以下方式联系：

- 📧 Email: [40579925@qq.com](mailto:40579925@qq.com)
- 💬 Issues: [GitHub Issues](https://github.com/tinyvane/UIDesigner/issues)

---

> ⚠️ 本项目中的第三方依赖库可能使用不同的开源协议，请参阅各依赖库的许可信息。
