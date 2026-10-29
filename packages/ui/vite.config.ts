import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(),  dts({ include: ['src/**/*.ts', 'src/**/*.vue'] })],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'McUI',
      fileName: 'mc-ui',
      formats: ['es'],
    },
    rollupOptions: { external: ['vue'] },
  },
})
