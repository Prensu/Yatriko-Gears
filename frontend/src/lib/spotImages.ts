/**
 * Build-safe resolver for season highlights / spots images.
 */
const map = import.meta.glob("../assets/spots/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}", {
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

export function resolveSpotImage(image?: string): string {
  if (!image) return filenameMap["mountain-ridge-camp.jpg"] ?? Object.values(filenameMap)[0] ?? ""
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
    return image
  }
  const cleanName = image.split("/").pop()?.toLowerCase() ?? ""
  return filenameMap[cleanName] ?? filenameMap["mountain-ridge-camp.jpg"] ?? Object.values(filenameMap)[0] ?? ""
}
