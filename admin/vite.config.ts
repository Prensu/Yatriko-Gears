import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

/**
 * This server exists to be proxied, not visited: the public site's dev server
 * (5173) forwards /admin here. Vite would otherwise print its own :5174 URL
 * and send you to the wrong address, so print the one you actually use.
 */
function announceProxiedUrl(): Plugin {
  return {
    name: "yatriko:announce-proxied-url",
    configureServer(server) {
      server.printUrls = () => {
        const green = "\x1b[32m"
        const cyan = "\x1b[36m"
        const dim = "\x1b[2m"
        const reset = "\x1b[0m"
        console.log("")
        console.log(`  ${green}\u279c${reset}  ${"Admin CMS:".padEnd(11)}${cyan}http://localhost:5173/admin${reset}`)
        console.log(`  ${dim}   (served through the public site — needs its dev server running too)${reset}`)
        console.log(`  ${dim}   direct: http://localhost:5174/admin/${reset}`)
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), announceProxiedUrl()],
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
