# Visual Dashboard Designer

## 工作流程

- 每完成一项任务后 git commit

## 开发工作流

- 每完成一个任务后，必须运行单元测试：`npm test`（或你实际的测试命令）
- 测试全部通过后，才能将该任务标记为已完成
- 如果测试失败，先修复问题，重新运行测试直到通过
- 开始工作前先阅读 plan.md 确认当前进度
- 每完成一项任务必须更新 plan.md 的状态
- 测试通过后 git commit

## 测试相关

- 测试框架：vitest
- 运行全部测试：`npx vitest run`
- 运行单个测试文件：`npx vitest run path/to/file.test.ts`
- 如果新增了功能，需要同时编写对应的单元测试

## Project Overview
Online visual dashboard (data screen) design platform. Users can upload images and use AI to convert them into editable UI components, then freely add/modify/delete components, and export deployable dashboard pages.

## Tech Stack
- **Framework**: Next.js 14+ (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS + CSS Variables + Shadcn/ui
- **State**: Zustand + Immer (editorStore + uiStore separated)
- **Validation**: Zod (shared between AI output validation, API, and forms)
- **Forms**: React Hook Form + Zod resolvers
- **Charts**: ECharts (lazy loaded per chart type)
- **Animation**: Framer Motion
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **AI**: Anthropic Claude API (Vision + Tool Use)
- **Storage**: S3/OSS compatible (MinIO for local dev)
- **Auth**: NextAuth.js v5
- **Testing**: Vitest + Testing Library + Playwright

## Key Conventions
- All coordinates are based on canvas original size (default 1920x1080), scaled at render time
- Component `propSchema` (Zod) drives: property panel auto-rendering, AI prompt schema, API validation
- `editorStore` = canvas/component data (persisted); `uiStore` = UI state (not persisted)
- Components self-register via `registry.ts` — add new widget by creating folder + calling `registerComponent()`
- AI prompts are versioned in `lib/ai/prompts/` — update when component library changes
- Use `React.lazy` for widget components, ECharts modules imported per chart type

## Directory Structure
```
src/
├── app/            # Next.js App Router pages + API routes
├── components/
│   ├── editor/     # Editor UI (Canvas, Toolbar, Panels)
│   ├── widgets/    # Dashboard visualization components
│   └── ui/         # Shared UI components (Shadcn/ui based)
├── stores/         # Zustand stores
├── schemas/        # Zod schemas (shared validation)
├── hooks/          # Custom React hooks
├── lib/            # Utilities, AI logic, export logic
├── prisma/         # Database schema + migrations
└── __tests__/      # Tests (mirrors src structure)
```

## Development Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run db:push      # Push Prisma schema to DB
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with templates
docker compose up -d # Start PostgreSQL + Redis
```

## Widget 开发要点（AI 识别联动）

Widget 是本系统的核心，其设计直接影响 AI 图片识别的效果。开发或修改 Widget 时必须遵循以下原则：

### 1. Prompt ↔ Widget 属性必须一一对应
- `src/lib/ai/prompts/v1.ts` 中定义的每个组件 Props Reference，必须与 Widget 实际接受的 props 完全对应
- 即使 Widget 在视觉上与原图 UI 一模一样，如果 prompt 中描述的属性名与 Widget 不匹配，AI 识别结果也无法正确渲染
- **新增/修改 Widget props 时，必须同步更新 prompt 中对应组件的 Props Reference**

### 2. AI 返回属性名与 Widget 不一定一致，需要后处理映射
- AI 模型可能使用不同的字段名（如 `direction:"horizontal"` vs `horizontal:true`，`barColor` vs `color`）
- 所有字段名映射逻辑集中在 `src/lib/ai/postProcess.ts` 的 `inferVisualProps()` 函数中
- **新增 Widget 时，必须检查 AI 实际返回的字段名，并在 postProcess 中添加对应的映射规则**

### 3. 数据格式兼容
- AI 可能返回不同格式的数据（如 `[{name,value}]` 数组 vs `{categories,values}` 对象）
- Widget 的数据解析函数（如 `parseBarData`）必须兼容多种格式
- 参考 `BarChart.tsx` 和 `LineChart.tsx` 中的 `parseBarData` / `parseLineData` 实现

### 4. 开发检查清单
新增或修改 Widget 时，请按以下顺序检查：
1. Widget props 定义（`propSchema`）
2. AI prompt 中的 Props Reference（`src/lib/ai/prompts/v1.ts`）→ 保持一致
3. postProcess 属性名映射（`src/lib/ai/postProcess.ts`）→ 处理 AI 可能的变体命名
4. 数据解析函数 → 兼容 AI 可能返回的多种数据格式
5. 编写/更新对应的单元测试

## Current Phase
Phase 1: Basic Canvas + Component System (in progress)
- See `plan.md` for detailed task tracking
