import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path";
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ react(), tailwindcss() ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "ce-client/src"),
    }
  },
  server: {
    proxy: {
      // Proxy API requests to backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '/api'), // optional, if needed
      }
    }
  }
})
