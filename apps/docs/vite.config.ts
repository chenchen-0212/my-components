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
  server: {
    proxy: {
      // 匹配所有以 /api 开头的请求路径
      '/api': {
        target: 'http://localhost:3000', // 你的后端服务地址
        changeOrigin: true,              // 必须：修改请求头中的 Origin，使其与目标地址一致
        rewrite: (path) => path.replace(/^\/api/, '') // 可选：重写路径，去掉 /api 前缀
      }
    }
  }
})
