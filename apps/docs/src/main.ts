/// <reference types="vite/client" />

import { createApp } from 'vue'
// 按需引入：只注册文档站用到的组件，避免整个 Element Plus（约 1MB）进入产物
import {
  ElConfigProvider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMenu,
  ElMenuItem,
  ElScrollbar,
} from 'element-plus'
// 样式保持全量：gzip 后约 48KB，换来「新增组件无需回来补样式 import」
import 'element-plus/dist/index.css'

import { router } from './route'
import { i18n } from './locales'
import App from './App.vue'

const app = createApp(App)

app.use(router).use(i18n)

// 新增 Element Plus 组件时，务必在这里补注册，否则模板里会报「Failed to resolve component」
app.component('ElConfigProvider', ElConfigProvider)
app.component('ElDropdown', ElDropdown)
app.component('ElDropdownItem', ElDropdownItem)
app.component('ElDropdownMenu', ElDropdownMenu)
app.component('ElMenu', ElMenu)
app.component('ElMenuItem', ElMenuItem)
app.component('ElScrollbar', ElScrollbar)

app.mount('#app')
