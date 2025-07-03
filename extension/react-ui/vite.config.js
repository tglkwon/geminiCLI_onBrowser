import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. path 모듈을 import 합니다.

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // 빌드 결과물이 생성될 폴더를 현재 폴더(react-ui)의 한 단계 상위 폴더(../) 밑에 'dist'라는 이름으로 지정합니다.
    outDir: '../dist',
    rollupOptions: {
      output: {
        entryFileNames: `assets/script.js`,
        chunkFileNames: `assets/script.js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})