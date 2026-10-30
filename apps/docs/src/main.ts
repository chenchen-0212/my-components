/// <reference types="vite/client" />

import { createApp } from 'vue'
// 按需引入：只注册文档站用到的组件，避免整个 Element Plus（约 1MB）进入产物
// import {
//   ElConfigProvider,
//   ElDropdown,
//   ElDropdownItem,
//   ElDropdownMenu,
//   ElMenu,
//   ElMenuItem,
//   ElScrollbar,
// } from 'element-plus'
// 样式保持全量：gzip 后约 48KB，换来「新增组件无需回来补样式 import」
import 'element-plus/dist/index.css'

import { router } from './route'
import { i18n } from './locales'
import App from './App.vue'

const app = createApp(App)

app.use(router).use(i18n)



app.mount('#app')
