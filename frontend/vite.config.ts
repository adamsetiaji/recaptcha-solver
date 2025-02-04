import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 5173,
      host: true // Needed for Docker
    },
    define: {
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(process.env.VITE_FRONTEND_PORT),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(process.env.VITE_BACKEND_PORT),
      'import.meta.env.VITE_VNC_PORT': JSON.stringify(process.env.VITE_VNC_PORT),
    },
  }
})