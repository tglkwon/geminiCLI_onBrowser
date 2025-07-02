import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/script.js`,
        chunkFileNames: `assets/script.js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})