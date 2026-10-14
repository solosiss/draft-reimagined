import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // rutas relativas: la app compilada se abre desde archivos locales (Electron)
  plugins: [svelte()],
})
