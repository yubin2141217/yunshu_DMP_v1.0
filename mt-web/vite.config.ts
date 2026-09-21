import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // 读取对应模式的 .env.[mode]，使 VITE_BASE_URL 同时作用于打包资源路径与路由 base
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    // GitLab Pages 等子路径部署时由 .env.production 的 VITE_BASE_URL 指定；本地/根路径默认 '/'
    base: env.VITE_BASE_URL || '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5174,
      host: true,
    },
  }
})
