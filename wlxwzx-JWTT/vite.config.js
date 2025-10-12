import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 使用相对路径，解决静态托管部署时的资源加载问题
  server: {
    host: '127.0.0.1',  // 使用IP地址代替localhost
    proxy: {
      '/__auth': {
        target: 'cloud1-8grkg0ar5f169249-1256962331.tcloudbaseapp.com',
        changeOrigin: true,
      }
    },
    allowedHosts: true
  }
}) 