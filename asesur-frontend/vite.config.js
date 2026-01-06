import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 ESTA LÍNEA ES OBLIGATORIA PARA GITHUB PAGES
  // Debe coincidir con el nombre de tu repositorio
  base: '/asesur-platform/', 
  server: {
    host: true, 
    allowedHosts: true, 
    // 👇 OJO: El proxy solo funciona en tu computadora (Localhost).
    // En GitHub Pages este proxy NO funciona, por eso cambiamos los fetch
    // a la URL completa de Render.
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})