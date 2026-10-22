// Configuración de Vite: React + Tailwind 4 + proxy a la API de ElysiaJS
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname ?? '.', './src') },
  },
  server: {
    port: 5173,
    // El frontend llama a /api y Vite lo reenvía al backend (puerto 3001)
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
})
