# MC UI

基于 **Vue 3 + Vite** 的个人组件库，pnpm monorepo + Turborepo 管理，以 **Element Plus** 作为基础组件依赖。

> 开发中 · 目前仅包含 Button 组件

## 目录结构

```
my-components/
├── packages/
│   ├── ui/          @mc-ui/core        组件库源码（构建产物在 dist/）
│   ├── utils/       @mc-ui/utils       纯工具函数
│   └── shared/      @mc-ui/shared      常量与类型
├── apps/
│   ├── playground/  @mc-ui/playground  本地调试（改完立刻看效果）
│   └── docs/        @mc-ui/docs        文档站
├── pnpm-workspace.yaml                 声明 packages/* 与 apps/* 为工作区成员
├── turbo.json                          任务调度（build / dev）
└── package.json
```

## 环境要求

- Node.js ≥ 18（推荐 20 / 22）
- pnpm ≥ 11（`corepack enable` 或 `npm i -g pnpm`）

本仓库使用 `workspace:*` 协议，**必须用 pnpm**，npm / yarn 安装会直接失败。

## 快速开始

```bash
# 1. 安装依赖（必须在仓库根目录执行）
pnpm install

# 2. 构建组件库（playground 依赖 dist，首次必须先构建）
pnpm -F @mc-ui/core build

# 3. 启动调试页面
pnpm -F @mc-ui/playground dev
```

浏览器打开 http://localhost:5173 即可看到组件效果。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm install` | 安装全部子项目依赖 |
| `pnpm build` | 按依赖顺序构建所有包（turbo 负责排序） |
| `pnpm dev` | 并行启动所有 dev 任务 |
| `pnpm -F @mc-ui/core build` | 只构建组件库 |
| `pnpm -F @mc-ui/core dev` | 组件库进入监听模式（改代码自动重建 dist） |
| `pnpm -F @mc-ui/playground dev` | 只启动 playground |
| `pnpm -F @mc-ui/docs dev` | 只启动文档站 |

`-F` 是 `--filter` 的简写，按包名筛选；也可以写路径：`pnpm --filter ./packages/ui build`。

## 新增一个组件

1. 在 `packages/ui/src/<分类>/` 下新建 `Xxx.vue`，用 `defineOptions({ name: 'McXxx' })` 声明组件名；
2. 在同目录的 `index.ts` 中导出：`export { default as McXxx } from './Xxx.vue'`；
3. 确认 `packages/ui/src/index.ts` 已 `export *` 到该分类目录；
4. 重新构建后即可在 playground 使用。

> ⚠️ 改了组件库源码**必须重新 build**：playground 读取的是 `packages/ui/dist`，不是 `src`。
> 开发期间可另开一个终端跑 `pnpm -F @mc-ui/core dev`，改动会自动重建 dist。

## 技术栈

| 用途 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` + TypeScript） |
| 构建 | Vite 5（库模式 `build.lib`） |
| 基础组件 | Element Plus 2（peer dependency，不打进产物） |
| 类型声明 | vite-plugin-dts |
| 任务调度 | Turborepo |

## 组件使用

```ts
import { McButton } from '@mc-ui/core'
```

```vue
<McButton type="primary">主要按钮</McButton>
<McButton>默认按钮</McButton>
<McButton disabled>禁用按钮</McButton>
```

`vue` 与 `element-plus` 声明为 `peerDependencies`，需由使用方自行安装，确保全项目只有一份实例：

```bash
npm i @mc-ui/core vue element-plus
```

> 内部封装依赖 Element Plus 的组件，宿主项目需引入其样式：`import 'element-plus/dist/index.css'`。
> 目前 Button 为原生实现，尚未依赖 EP 样式。

## 发布

```bash
pnpm -F @mc-ui/core build
cd packages/ui
npm pack --dry-run   # 先确认将上传的文件
npm publish
```

作用域包首次发布需加 `--access public`，并在 `package.json` 中配置 `publishConfig.access`。

## License

MIT
