import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 热更新时同步路由，无需刷新页面
if (import.meta.hot) {
  handleHotUpdate(router)
}