<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/** 窄屏下侧栏以抽屉形式滑出 */
const sidebarOpen = ref(false)

// 菜单直接由路由表生成：新增 src/pages/xxx.vue 后自动出现在侧栏，无需手动维护
const menu = computed(() =>
  router
    .getRoutes()
    .filter((item) => !item.path.includes(':') && !item.path.includes('('))
    .map((item) => ({
      path: item.path,
      // meta 的值类型是 unknown，取字符串要断言
      label: (item.meta.title as string) ?? (item.path === '/' ? '首页' : item.path.slice(1)),
      order: (item.meta.order as number) ?? 999,
    }))
    // 先按 order，再按路径
    .sort((a, b) => a.order - b.order || a.path.localeCompare(b.path))
)

// 切换页面后自动收起移动端侧栏
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)
</script>

<template>
  <header class="docs-header">
    <button
      class="docs-header__toggle"
      type="button"
      aria-label="切换侧边菜单"
      :aria-expanded="sidebarOpen"
      @click="sidebarOpen = !sidebarOpen"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <RouterLink class="docs-header__logo" to="/">MC UI</RouterLink>

    <nav class="docs-header__nav">
      <a href="https://element-plus.org/zh-CN/component/overview" target="_blank" rel="noreferrer">
        Element Plus
      </a>
    </nav>
  </header>

  <div class="docs-body">
    <aside class="docs-aside" :class="{ 'is-open': sidebarOpen }">
      <p class="docs-aside__title">组件</p>
      <el-scrollbar>
        <el-menu :default-active="route.path" router class="docs-menu">
          <el-menu-item v-for="item in menu" :key="item.path" :index="item.path">
            {{ item.label }}
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </aside>

    <div v-if="sidebarOpen" class="docs-mask" @click="sidebarOpen = false" />

    <main class="docs-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color);
  -webkit-font-smoothing: antialiased;
}

/* 固定顶栏 */
.docs-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  padding: 0 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.docs-header__logo {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-color-primary);
  text-decoration: none;
}

.docs-header__nav {
  margin-left: auto;
  font-size: 14px;
}

.docs-header__nav a {
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: color 0.2s;
}

.docs-header__nav a:hover {
  color: var(--el-color-primary);
}

/* 汉堡按钮，仅窄屏显示 */
.docs-header__toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border: 0;
  background: none;
  cursor: pointer;
}

.docs-header__toggle span {
  width: 18px;
  height: 2px;
  background-color: var(--el-text-color-primary);
}

.docs-body {
  padding-top: 60px;
}

/* 侧栏：固定在顶栏下方，独立滚动 */
.docs-aside {
  position: fixed;
  top: 60px;
  bottom: 0;
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: 260px;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}

.docs-aside__title {
  margin: 0;
  padding: 16px 24px 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.docs-aside .el-scrollbar {
  flex: 1;
  overflow: hidden;
}

.docs-menu {
  border-right: none;
}

.docs-menu .el-menu-item {
  height: 40px;
  line-height: 40px;
  padding-left: 24px !important;
}

/* 主内容区 */
.docs-main {
  box-sizing: border-box;
  max-width: 1080px;
  min-height: calc(100vh - 60px);
  margin-left: 260px;
  padding: 32px 40px 64px;
}

.docs-mask {
  display: none;
}

/* 窄屏：侧栏滑出，主区占满 */
@media (max-width: 768px) {
  .docs-header {
    padding: 0 12px;
  }

  .docs-header__toggle {
    display: inline-flex;
  }

  .docs-aside {
    width: 240px;
    transition: transform 0.25s ease;
    transform: translateX(-100%);
  }

  .docs-aside.is-open {
    transform: none;
  }

  .docs-main {
    margin-left: 0;
    padding: 24px 16px 48px;
  }

  .docs-mask {
    position: fixed;
    top: 60px;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 99;
    display: block;
    background-color: rgb(0 0 0 / 0.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .docs-aside {
    transition: none;
  }
}
</style>
