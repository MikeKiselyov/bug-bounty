import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base + hash routing lets the build run on GitHub Pages under any repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
})
