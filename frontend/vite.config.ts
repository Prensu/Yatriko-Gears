import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the Express backend during development.
      "/api": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
      "/gemini": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
    },
  },
})
