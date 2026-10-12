import { sanitizeRichHtml } from "./sanitize"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function inlineMarkdown(value: string): string {
  let html = escapeHtml(value)
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>")
  html = html.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "<em>$1</em>")
  return html
}

/** Small, safe Markdown subset for assistant replies. Raw HTML is escaped. */
export function renderChatMarkdown(markdown: string): string {
  const lines = markdown.trim().split(/\r?\n/)
  const output: string[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let orderedList = false

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      output.push(`<p>${paragraph.map(inlineMarkdown).join("<br/>\n")}</p>`)
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length > 0) {
      const tag = orderedList ? "ol" : "ul"
      output.push(`<${tag}>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`)
      list = []
      orderedList = false
    }
  }

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    const unordered = line.match(/^\s*[-*]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = Math.min(line.match(/^#+/)?.[0].length ?? 1, 3)
      output.push(`<h${level}>${inlineMarkdown(heading[1])}</h${level}>`)
    } else if (unordered || ordered) {
      flushParagraph()
      const isOrdered = Boolean(ordered)
      if (list.length > 0 && orderedList !== isOrdered) flushList()
      orderedList = isOrdered
      list.push((unordered ?? ordered)?.[1] ?? "")
    } else if (line.trim() === "") {
      flushParagraph()
      flushList()
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()

  return sanitizeRichHtml(output.join(""))
}

