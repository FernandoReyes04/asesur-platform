import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    allowedHosts: true, 
    // AGREGAMOS ESTO PARA CONECTAR EL BACKEND 👇
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Tu backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
