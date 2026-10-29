# MC UI

基于 **Vue 3 + Vite** 的个人组件库，pnpm monorepo + Turborepo 管理，以 **Element Plus** 作为基础组件依赖，配套一个自带布局与 i18n 的文档站。

> 开发中 · 组件目前仅包含 Button

## 目录结构

```
my-components/
├── packages/
│   ├── ui/                    @mc-ui/core        组件库源码（构建产物在 dist/）
│   │   ├── src/button/        Button.vue + index.ts
│   │   ├── src/index.ts       组件总出口
│   │   ├── vite.config.ts     库模式构建（vue / element-plus 外置）
│   │   └── tsconfig.json
│   ├── utils/                 @mc-ui/utils       纯工具函数（直接导出 .ts 源码）
│   └── shared/                @mc-ui/shared      常量与类型（直接导出 .ts 源码）
├── apps/
│   ├── playground/            @mc-ui/playground  本地调试页（最小 Vue 应用）
│   └── docs/                  @mc-ui/docs        文档站
│       ├── src/pages/         页面（文件路由，pages/xxx.vue → /xxx）
│       ├── src/route/         路由实例
│       ├── src/locales/       i18n 词条（zh-CN / en-US）
│       └── src/App.vue        固定顶栏 + el-menu 侧栏 + RouterView
├── pnpm-workspace.yaml        声明 packages/* 与 apps/* 为工作区成员
├── turbo.json                 任务调度（build / dev）
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

# 2. 构建组件库（两个应用都依赖 dist，首次必须先构建）
pnpm -F @mc-ui/core build

# 3. 任选其一启动
pnpm -F @mc-ui/playground dev    # 本地调试页
pnpm -F @mc-ui/docs dev          # 文档站
```

默认地址 http://localhost:5173 。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm install` | 安装全部子项目依赖 |
| `pnpm build` | 按依赖顺序构建所有包（turbo 负责排序） |
| `pnpm dev` | 并行启动所有 dev 任务 |
| `pnpm -F @mc-ui/core build` | 只构建组件库 |
| `pnpm -F @mc-ui/core dev` | 组件库监听模式（改源码自动重建 dist） |
| `pnpm -F @mc-ui/playground dev` | 只启动调试页 |
| `pnpm -F @mc-ui/docs dev` | 只启动文档站 |
| `pnpm -F @mc-ui/docs build` | 构建文档站静态产物 |

`-F` 是 `--filter` 的简写，按包名筛选；也可以写路径：`pnpm --filter ./packages/ui build`。

## 组件库（packages/ui）

### 新增一个组件

1. 在 `packages/ui/src/<分类>/` 下新建 `Xxx.vue`，用 `defineOptions({ name: 'McXxx' })` 声明组件名；
2. 在同目录 `index.ts` 中导出：`export { default as McXxx } from './Xxx.vue'`；
3. 确认 `packages/ui/src/index.ts` 已 `export *` 到该分类目录；
4. `pnpm -F @mc-ui/core build`，然后在 playground / 文档站使用。

> ⚠️ 改了组件源码**必须重新构建**：两个应用读取的是 `packages/ui/dist`，不是 `src`。
> 开发期间可另开终端跑 `pnpm -F @mc-ui/core dev` 自动重建。

### 现有组件

| 组件 | 说明 | 主要 props |
| --- | --- | --- |
| `McButton` | 原生按钮实现 | `type`（`default` / `primary`）、`nativeType`（`button` / `submit` / `reset`）、`disabled` |

## 文档站（apps/docs）

### 布局

固定顶栏（60px）+ 左侧 `el-menu`（`router` 模式，点击即路由）+ 右侧 `<RouterView />`。窄屏（≤768px）侧栏滑出为抽屉，带遮罩层，切换路由自动收起。

### 路由约定

采用 vue-router 5 的**文件路由**：`src/pages/xxx.vue` 自动生成 `/xxx`，无需手写路由表。

页面用 `definePage()` 宏声明元信息（编译期生效，不参与运行时）：

```vue
<script setup lang="ts">
definePage({
  meta: { title: '复制按钮', order: 2 },
})
</script>
```

- `meta.title`：菜单文案兜底值
- `meta.order`：菜单排序，越小越靠前（未设置为 999）

### Element Plus 按需注册

为避免把整个 Element Plus 打进产物，`src/main.ts` 里**逐个注册**组件：

```ts
app.component('ElMenu', ElMenu)
```

新页面用到新的 EP 组件时，**必须回 `main.ts` 补一行注册**，否则模板不渲染，控制台只有一条 `Failed to resolve component` 警告。

### 国际化

- 词条位置：`src/locales/zh-CN.ts`、`src/locales/en-US.ts`
- 语言切换：顶栏下拉，写入 `localStorage` 并同步 `<html lang>`
- 菜单 key 规则：`/` → `menu.home`，`/copy` → `menu.copy`（由路径派生）
- Element Plus 内置文案由 `<el-config-provider :locale>` 跟随站点语言

新增文案时在两个语言文件里补同名 key；缺 key 会回退到 `fallbackLocale`（中文），**不会报错**，所以改完记得切语言看一眼。

## 技术栈

| 用途 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` + TypeScript） |
| 构建 | Vite 5（组件库走 `build.lib` 库模式） |
| 基础组件 | Element Plus 2（组件库中作为 peer dependency，不打进产物） |
| 文档站路由 | vue-router 5（文件路由 + `definePage` 宏） |
| 文档站 i18n | vue-i18n 11（Composition API 模式） |
| 类型声明 | vite-plugin-dts |
| 任务调度 | Turborepo |

## 组件使用

```ts
import { McButton } from '@mc-ui/core'
definePage({
  meta: { title: '复制按钮', order: 2 }, // 定制菜单标题
})
```

```vue
<McButton type="primary">主要按钮</McButton>
<McButton>默认按钮</McButton>
<McButton native-type="submit" disabled>禁用按钮</McButton>
```

`vue` 与 `element-plus` 声明为 `peerDependencies`，需由使用方自行安装，确保全项目只有一份实例：

```bash
npm i @mc-ui/core vue element-plus
```

> 封装了 Element Plus 组件的组件依赖其样式，宿主项目需引入：`import 'element-plus/dist/index.css'`。
> 当前 Button 为原生实现，不依赖 EP 样式。

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
