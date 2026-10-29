import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'


export default defineConfig({
  plugins: [
    VueRouter({
      dts: 'typed-router.d.ts', // 生成类型声明文件
      // routesFolder: 'src/pages',
    }),
    vue()
  ],
})
