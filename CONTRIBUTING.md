# Contributing to Dashboard Designer / 贡献指南

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

---

<a id="english"></a>

## English

Thank you for your interest in contributing to **Dashboard Designer**! This document explains how to contribute, what to expect, and the rules you need to follow.

### License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](./LICENSE). By contributing, you agree that your contributions will be licensed under the same license.

### Contributor License Agreement (CLA)

**All contributors must sign our [Contributor License Agreement (CLA)](./CLA.md) before any pull request can be merged.**

- When you open your first PR, the CLA Assistant bot will automatically post a comment.
- You sign the CLA by posting a comment in the PR with the exact text: `I have read the CLA Document and I hereby sign the CLA`.
- You only need to sign once — it covers all future contributions to this repository.
- PRs from contributors who have not signed the CLA will not be merged.

**Why do we need a CLA?**

Dashboard Designer follows an **Open Core** model: the Community Edition is open-source (AGPLv3), while a Professional Edition with additional features is offered under a commercial license. The CLA grants the project maintainers the right to re-license contributions, which is necessary to include community contributions in the commercially-licensed version. Without the CLA, community code could only be distributed under AGPLv3.

### How to Contribute

#### Reporting Bugs

- Use [GitHub Issues](https://github.com/tinyvane/UIDesigner/issues) to report bugs.
- Include steps to reproduce, expected vs. actual behavior, and screenshots if applicable.
- Check existing issues before opening a new one.

#### Suggesting Features

- Open a [GitHub Issue](https://github.com/tinyvane/UIDesigner/issues) with the label `enhancement`.
- Describe the feature, use case, and why it would benefit the project.

#### Submitting Code

1. **Fork** the repository and clone your fork.
2. **Create a feature branch** from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** — follow the code conventions below.
4. **Write tests** for new features or bug fixes.
5. **Run tests** to make sure everything passes:
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```
6. **Commit** with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add radar chart widget
   fix: bar chart not updating with bound data source
   docs: update README with new export options
   ```
7. **Push** to your fork and open a **Pull Request** targeting the `dev` branch.
8. **Sign the CLA** when prompted by the bot.

#### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases only. Tagged with version numbers (e.g., `v1.0.0`). |
| `dev` | Active development. All PRs should target this branch. |
| `feature/*` | Individual feature branches, merged into `dev`. |

**Do not open PRs directly against `main`** — all changes go through `dev` first.

### Code Conventions

- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS — use utility classes, avoid custom CSS
- **Components**: Functional components with hooks, no class components
- **State**: Use `editorStore` for persisted canvas data, `uiStore` for ephemeral UI state
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/types, `UPPER_SNAKE_CASE` for constants
- **Formatting**: Prettier (auto-enforced via pre-commit hook)
- **Linting**: ESLint (Next.js config + Prettier plugin)
- **Testing**: Vitest — write tests in `src/__tests__/` mirroring the source structure
- **New widgets**: Create a folder under `src/components/widgets/`, self-register via `registerComponent()`, and add an import in `src/components/widgets/index.ts`

### Code Review

- All PRs require at least one review from a maintainer.
- Keep PRs focused — one feature or fix per PR.
- Respond to review feedback promptly; stale PRs may be closed.

### Community Guidelines

- Be respectful and constructive.
- No spam, harassment, or off-topic discussions.
- Follow the [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines).

---

<a id="中文"></a>

## 中文

感谢你有兴趣为 **Dashboard Designer** 做出贡献！本文档说明了如何参与贡献、流程规范以及需要遵守的规则。

### 许可证

本项目基于 [GNU Affero General Public License v3.0 (AGPLv3)](./LICENSE) 开源。参与贡献即表示你同意你的贡献将以相同许可证发布。

### 贡献者许可协议 (CLA)

**所有贡献者在 PR 合并前，必须签署我们的[贡献者许可协议 (CLA)](./CLA.md)。**

- 当你首次提交 PR 时，CLA Assistant 机器人会自动发表评论。
- 你需要在 PR 中回复以下文字来签署 CLA：`I have read the CLA Document and I hereby sign the CLA`
- 只需签署一次，即可覆盖你在本仓库的所有未来贡献。
- 未签署 CLA 的贡献者的 PR 将不会被合并。

**为什么需要 CLA？**

Dashboard Designer 采用 **Open Core** 模式：社区版开源（AGPLv3），专业版以商业许可证提供额外功能。CLA 授予项目维护者对贡献代码的再许可权利，这是将社区贡献纳入商业版本的必要条件。没有 CLA，社区贡献的代码只能以 AGPLv3 分发。

### 如何贡献

#### 报告 Bug

- 使用 [GitHub Issues](https://github.com/tinyvane/UIDesigner/issues) 报告 Bug。
- 请包含复现步骤、预期行为与实际行为的对比，以及相关截图。
- 提交前请先检查是否已有相同的 Issue。

#### 功能建议

- 在 [GitHub Issues](https://github.com/tinyvane/UIDesigner/issues) 中提交，标记为 `enhancement`。
- 描述功能、使用场景，以及为什么该功能对项目有益。

#### 提交代码

1. **Fork** 本仓库并克隆到本地。
2. **从 `dev` 创建功能分支**：
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/你的功能名称
   ```
3. **编写代码** — 遵循下方的代码规范。
4. **编写测试** — 新功能和 Bug 修复都需要对应的测试。
5. **运行测试**，确保全部通过：
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```
6. **提交**，使用清晰的 [Conventional Commits](https://www.conventionalcommits.org/) 格式：
   ```
   feat: 新增雷达图组件
   fix: 修复柱状图绑定数据源后不刷新的问题
   docs: 更新 README 导出功能说明
   ```
7. **推送**到你的 Fork，并向 `dev` 分支提交 **Pull Request**。
8. 按照机器人提示 **签署 CLA**。

#### 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 仅用于稳定发布。使用版本标签（如 `v1.0.0`）。 |
| `dev` | 活跃开发分支。所有 PR 应以此为目标分支。 |
| `feature/*` | 独立功能分支，完成后合并到 `dev`。 |

**请勿直接向 `main` 提交 PR** — 所有变更先经过 `dev`。

### 代码规范

- **语言**：TypeScript（严格模式）
- **样式**：Tailwind CSS — 使用工具类，避免自定义 CSS
- **组件**：函数式组件 + Hooks，不使用 Class 组件
- **状态管理**：`editorStore` 用于持久化画布数据，`uiStore` 用于临时 UI 状态
- **命名**：变量/函数用 `camelCase`，组件/类型用 `PascalCase`，常量用 `UPPER_SNAKE_CASE`
- **格式化**：Prettier（通过 pre-commit hook 自动执行）
- **代码检查**：ESLint（Next.js 配置 + Prettier 插件）
- **测试**：Vitest — 测试文件放在 `src/__tests__/`，结构与源码目录一致
- **新增组件**：在 `src/components/widgets/` 下创建文件夹，通过 `registerComponent()` 自注册，并在 `src/components/widgets/index.ts` 中添加导入

### 代码审查

- 所有 PR 需要至少一位维护者审查。
- PR 保持聚焦 — 每个 PR 只做一个功能或修复。
- 请及时回复审查反馈；长期无响应的 PR 可能会被关闭。

### 社区准则

- 保持尊重和建设性的态度。
- 禁止垃圾信息、骚扰或偏离主题的讨论。
- 请遵守 [GitHub 社区准则](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines)。
