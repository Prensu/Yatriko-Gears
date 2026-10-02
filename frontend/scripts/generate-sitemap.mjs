import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const frontendDirectory = path.resolve(scriptDirectory, "..")
const publicDirectory = path.join(frontendDirectory, "public")
const sitemapPath = path.join(publicDirectory, "sitemap.xml")

async function loadEnvFile(filePath) {
  try {
    const contents = await readFile(filePath, "utf8")
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "")
    }
  } catch {
    // Vercel and CI provide environment variables directly.
  }
}

await loadEnvFile(path.join(frontendDirectory, ".env"))
await loadEnvFile(path.join(frontendDirectory, ".env.local"))

const siteUrl = (process.env.VITE_SITE_URL || "https://yatrikogears.com").replace(/\/+$/, "")
const configuredApiBase = (process.env.SITEMAP_API_URL || process.env.VITE_API_BASE_URL || siteUrl).replace(/\/+$/, "")
const apiBase = configuredApiBase.endsWith("/api/v1")
  ? configuredApiBase
  : `${configuredApiBase}/api/v1`

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

async function fetchActiveList(resource) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(`${apiBase}/${resource}?limit=100&status=active`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)

    const payload = await response.json()
    if (!Array.isArray(payload?.data)) throw new Error("API response did not contain a data array")
    return payload.data
  } finally {
    clearTimeout(timeout)
  }
}

async function existingGearUrls() {
  try {
    const existing = await readFile(sitemapPath, "utf8")
    return [...existing.matchAll(new RegExp(`${escapeRegex(siteUrl)}/gear/([^<]+)`, "g"))]
      .map((match) => `/gear/${match[1]}`)
  } catch {
    return []
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function urlEntry(route, changefreq, priority) {
  return `  <url>\n    <loc>${escapeXml(`${siteUrl}${route}`)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

const staticRoutes = [
  ["/", "weekly", "1.0"],
  ["/gear", "weekly", "0.9"],
  ["/portfolio", "monthly", "0.7"],
  ["/blog", "weekly", "0.8"],
  ["/contact", "monthly", "0.8"],
]

let gearRoutes = await existingGearUrls()
try {
  const gear = await fetchActiveList("gear")
  gearRoutes = gear
    .map((item) => (typeof item?.slug === "string" ? `/gear/${item.slug}` : null))
    .filter(Boolean)
  console.log(`Sitemap: included ${gearRoutes.length} active gear URLs.`)
} catch (error) {
  console.warn(`Sitemap: could not fetch live gear (${error.message}); preserving existing gear URLs.`)
}

try {
  const destinations = await fetchActiveList("destination")
  if (destinations.length > 0) {
    console.warn(
      `Sitemap: fetched ${destinations.length} active destinations, but no public destination route exists; not emitting 404 URLs.`,
    )
  }
} catch (error) {
  console.warn(`Sitemap: could not fetch live destinations (${error.message}); /portfolio remains the indexable field-content route.`)
}

let blogRoutes = []
try {
  const blogs = await fetchActiveList("blog")
  blogRoutes = blogs
    .map((item) => (typeof item?.slug === "string" ? `/blog/${item.slug}` : null))
    .filter(Boolean)
  console.log(`Sitemap: included ${blogRoutes.length} published blog URLs.`)
} catch (error) {
  console.warn(`Sitemap: could not fetch published blogs (${error.message}); /blog remains the indexable blog route.`)
}

const routes = new Set(staticRoutes.map(([route]) => route))
for (const route of gearRoutes) routes.add(route)
for (const route of blogRoutes) routes.add(route)

const dynamicEntries = [...routes]
  .filter((route) => !staticRoutes.some(([staticRoute]) => staticRoute === route))
  .sort()
  .map((route) => urlEntry(route, "weekly", "0.8"))

const staticEntries = staticRoutes.map(([route, changefreq, priority]) => urlEntry(route, changefreq, priority))
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...staticEntries,
  ...dynamicEntries,
  "</urlset>",
  "",
].join("\n")

await writeFile(sitemapPath, sitemap, "utf8")
console.log(`Sitemap: wrote ${routes.size} URLs to ${sitemapPath}`)
