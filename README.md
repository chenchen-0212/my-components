# MC UI

基于 **Vue 3 + Vite** 的个人组件库，pnpm monorepo + Turborepo 管理，以 **Element Plus** 作为基础组件依赖，配套文档站和一个 **NestJS + BullMQ** 的后端服务。

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
│   ├── docs/                  @mc-ui/docs        文档站
│   │   ├── src/pages/         页面（文件路由，pages/xxx.vue → /xxx）
│   │   ├── src/route/         路由实例
│   │   ├── src/locales/       i18n 词条（zh-CN / en-US）
│   │   └── src/App.vue        固定顶栏 + el-menu 侧栏 + RouterView
│   └── backend/               @mc-ui/backend     NestJS 服务 + BullMQ 队列
│       ├── src/main.ts        入口（监听 PORT，默认 3000）
│       ├── src/app.module.ts  根模块
│       └── src/queue/         队列模块 / 消费者 / 示例接口
├── pnpm-workspace.yaml        声明 packages/* 与 apps/* 为工作区成员
├── turbo.json                 任务调度（build / dev）
└── package.json
```

## 环境要求

- Node.js ≥ 20（开发机实测 22）
- pnpm ≥ 11（`corepack enable` 或 `npm i -g pnpm`）
- Redis ≥ 6.2（仅后端需要；BullMQ 启动时会检查版本，低于 5.0 直接报错）

本仓库使用 `workspace:*` 协议，**必须用 pnpm**，npm / yarn 安装会直接失败。

## 快速开始

```bash
# 1. 安装依赖（必须在仓库根目录执行）
pnpm install

# 2. 构建组件库（两个前端应用都依赖 dist，首次必须先构建）
pnpm -F @mc-ui/core build

# 3. 任选其一启动
pnpm -F @mc-ui/playground dev    # 本地调试页  http://localhost:5173
pnpm -F @mc-ui/docs dev          # 文档站      http://localhost:5173
pnpm -F @mc-ui/backend dev       # 后端服务    http://localhost:3000（需先启动 Redis）
```

两个前端应用的默认端口都是 5173，同时启动时后者会自动顺延到 5174。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm install` | 安装全部子项目依赖 |
| `pnpm build` | 按依赖顺序构建所有包（turbo 负责排序） |
| `pnpm dev` | 并行启动所有 dev 任务（含后端，需 Redis 就绪） |
| `pnpm -F @mc-ui/core build` | 只构建组件库 |
| `pnpm -F @mc-ui/core dev` | 组件库监听模式（改源码自动重建 dist） |
| `pnpm -F @mc-ui/playground dev` | 只启动调试页 |
| `pnpm -F @mc-ui/docs dev` | 只启动文档站 |
| `pnpm -F @mc-ui/docs build` | 构建文档站静态产物 |
| `pnpm -F @mc-ui/backend dev` | 后端 watch 模式 |
| `pnpm -F @mc-ui/backend build` | 后端编译到 `dist/` |

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

### 本地代理

文档站 dev server 把 `/api` 前缀转发给后端（见 `vite.config.ts`）：请求 `/api/jobs` 去掉前缀后打到 `http://<target>/jobs`。

`target` 必须与后端 `PORT` 保持一致（默认 3000）。如果后端以后加了 `setGlobalPrefix('api')`，把 `rewrite` 整行删掉，让 `/api` 原样转发。

## 后端服务（apps/backend）

NestJS 12（ESM）+ BullMQ 6，无鉴权，定位是给前端提供接口和异步任务。

### 启动

```bash
# Redis 需先跑起来（Windows 上已注册为服务）
net start Redis

pnpm -F @mc-ui/backend dev     # watch 模式
pnpm -F @mc-ui/backend build   # 编译
node dist/main.js              # 跑编译产物
```

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务端口 |
| `REDIS_HOST` | `127.0.0.1` | |
| `REDIS_PORT` | `6379` | |
| `REDIS_PASSWORD` | 空 | |
| `REDIS_DB` | `0` | |

没有接 dotenv，直接读 `process.env`，因此需要在启动进程的环境里设置。

### 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/jobs` | body `{ "message": "..." }`，返回 `{ "id": "1" }` |
| `GET` | `/jobs/:id` | 返回 `{ state, result, failedReason }`，`state` 为 `waiting` / `active` / `completed` / `failed` |

### 加一个队列

1. `queue.module.ts` 里 `BullModule.registerQueue({ name: 'xxx' })`；
2. 新建 `@Processor('xxx')` 类继承 `WorkerHost`，实现 `process(job)`；
3. 把 processor 加进 `providers`，用 `@InjectQueue('xxx')` 往队列投任务。

### 几个容易踩的点

- 后端是 **ESM**（Nest 12 只发 ESM），相对导入必须带 `.js` 后缀：`import { AppModule } from './app.module.js'`。
- `typescript` 锁在 `^6`：Nest CLI 用不了 TS 7（没有暴露 compiler API）。
- `ioredis` 是 bullmq 6 的**可选 peer**，且在 ESM 下它自己 `require` 不到，所以代码里是自建 `Redis` 实例传进 `BullModule.forRoot({ connection })`，而不是传连接参数对象。

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
| 后端 | NestJS 12（ESM）+ Express |
| 队列 | BullMQ 6 + ioredis |

## 组件使用

```ts
import { McButton } from '@mc-ui/core'
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
