import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The CMS is mounted at <origin>/admin — in dev the public site's Vite
  // server proxies /admin here, in production the built files are served
  // from an /admin/ subdirectory. Every asset URL needs that prefix.
  base: "/admin/",
  resolve: {
    // tsconfig "paths" only teaches the type-checker — Vite needs this too.
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    // 5173 belongs to the public site; the CMS runs alongside it on 5174.
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
      "/images": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
    },
  },
})
