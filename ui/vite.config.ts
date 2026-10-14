import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: './', // rutas relativas: la app compilada se abre desde archivos locales (Electron)
  plugins: [svelte()],
  test: { include: ['src/**/*.test.ts'] }, // las pruebas de electron/ usan node:test
})
