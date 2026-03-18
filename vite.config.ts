import { defineConfig } from 'vite'

// Конфигурация для демо-приложения
export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist'
  }
})
