import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 默认 vendor
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
