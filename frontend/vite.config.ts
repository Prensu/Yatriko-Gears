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
      // The admin CMS is a separate Vite app (admin/, port 5174) mounted here
      // so it shares this origin: http://localhost:5173/admin
      // ws:true keeps its hot-reload socket working through the proxy.
      "/admin": {
        target: "http://localhost:5174",
        changeOrigin: true,
        ws: true,
        // Vite serves the CMS at the "/admin/" base, so a bare "/admin"
        // (what people actually type) has to pick up the trailing slash.
        rewrite: (path) => (path === "/admin" ? "/admin/" : path),
      },
    },
  },
})
