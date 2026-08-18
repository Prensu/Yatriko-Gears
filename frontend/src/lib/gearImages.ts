/**
 * Build-safe resolver for local gear images.
 * fallbackData stores bare filenames; backend rows will store full URLs.
 */
const map = import.meta.glob("../assets/gear/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

// Map lowercase filename to imported asset URL
const filenameMap: Record<string, string> = {}
for (const [path, url] of Object.entries(map)) {
  const filename = path.split("/").pop()?.toLowerCase()
  if (filename) {
    filenameMap[filename] = url
  }
}

export function resolveGearImage(image: string): string {
  if (!image) return ""
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/uploads") || image.startsWith("data:")) {
    return image
  }
  const cleanName = image.split("/").pop()?.toLowerCase() ?? ""
  return filenameMap[cleanName] ?? map[`../assets/gear/${image}`] ?? ""
}

