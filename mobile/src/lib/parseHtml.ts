/**
 * Tiny parser for the chat bot's replies.
 *
 * The backend sends HTML that has already been run through sanitize-html with
 * this whitelist: p, br, strong/b, em/i, ul, ol, li, a, code. React Native has
 * no HTML renderer, and a WebView per chat bubble would be heavy, so this
 * turns that small subset into blocks the app renders with plain <Text>.
 * Unknown tags are dropped but their text is kept; nothing is ever executed.
 */
export type Inline =
  | { kind: "text"; text: string; bold: boolean; italic: boolean; code: boolean; href?: string }
  | { kind: "br" }

export type Block =
  | { kind: "paragraph"; inlines: Inline[]; heading: boolean }
  | { kind: "list"; ordered: boolean; items: Inline[][] }

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return ENTITIES[entity.toLowerCase()] ?? match
  })
}

const TOKEN = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)|(<)/g
const HEADING = /^h[1-6]$/
const BLOCK_BREAK = new Set(["p", "div", "blockquote"])

function trimInlines(inlines: Inline[]): Inline[] {
  const out = [...inlines]
  while (out.length) {
    const first = out[0]
    if (first && (first.kind === "br" || (first.kind === "text" && first.text.trim() === ""))) out.shift()
    else break
  }
  while (out.length) {
    const last = out[out.length - 1]
    if (last && (last.kind === "br" || (last.kind === "text" && last.text.trim() === ""))) out.pop()
    else break
  }
  const first = out[0]
  if (first && first.kind === "text") out[0] = { ...first, text: first.text.replace(/^\s+/, "") }
  const lastIndex = out.length - 1
  const last = out[lastIndex]
  if (last && last.kind === "text") out[lastIndex] = { ...last, text: last.text.replace(/\s+$/, "") }
  return out
}

export function parseHtml(html: string): Block[] {
  const blocks: Block[] = []
  let current: Inline[] = []
  let list: { ordered: boolean; items: Inline[][] } | null = null
  let inItem = false
  let bold = 0
  let italic = 0
  let code = 0
  const hrefs: string[] = []

  const pushBlock = (block: Block) => {
    const prev = blocks[blocks.length - 1]
    if (block.kind === "list" && prev?.kind === "list" && prev.ordered === block.ordered) {
      prev.items.push(...block.items)
    } else {
      blocks.push(block)
    }
  }

  const flushParagraph = (heading = false) => {
    const inlines = trimInlines(current)
    current = []
    if (inlines.length) pushBlock({ kind: "paragraph", inlines, heading })
  }

  const flushList = () => {
    if (list && list.items.length) pushBlock({ kind: "list", ordered: list.ordered, items: list.items })
    list = null
  }

  const endItem = () => {
    const item = trimInlines(current)
    current = []
    inItem = false
    if (item.length) {
      list ??= { ordered: false, items: [] }
      list.items.push(item)
    }
  }

  for (const match of html.matchAll(TOKEN)) {
    const [, closing, rawTag, attrs, text, strayLt] = match

    if (text !== undefined || strayLt !== undefined) {
      const raw = text ?? "<"
      // HTML collapses runs of whitespace (including the newlines between tags).
      const decoded = decodeEntities(raw).replace(/[ \t\r\n]+/g, " ")
      if (decoded === "") continue
      current.push({
        kind: "text",
        text: decoded,
        bold: bold > 0,
        italic: italic > 0,
        code: code > 0,
        ...(hrefs.length ? { href: hrefs[hrefs.length - 1] } : {}),
      })
      continue
    }

    const tag = (rawTag ?? "").toLowerCase()
    const isClose = closing === "/"

    if (tag === "br") {
      current.push({ kind: "br" })
    } else if (tag === "strong" || tag === "b") {
      bold = Math.max(0, bold + (isClose ? -1 : 1))
    } else if (tag === "em" || tag === "i") {
      italic = Math.max(0, italic + (isClose ? -1 : 1))
    } else if (tag === "code") {
      code = Math.max(0, code + (isClose ? -1 : 1))
    } else if (tag === "a") {
      if (isClose) hrefs.pop()
      else {
        const href = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs ?? "")
        hrefs.push(decodeEntities(href?.[1] ?? href?.[2] ?? ""))
      }
    } else if (tag === "ul" || tag === "ol") {
      if (isClose) {
        if (inItem) endItem()
        flushList()
      } else {
        if (!inItem) flushParagraph()
        flushList()
        list = { ordered: tag === "ol", items: [] }
      }
    } else if (tag === "li") {
      if (isClose) {
        if (inItem) endItem()
      } else {
        if (inItem) endItem()
        else flushParagraph()
        inItem = true
      }
    } else if (HEADING.test(tag)) {
      if (isClose) {
        bold = Math.max(0, bold - 1)
        flushParagraph(true)
      } else {
        flushParagraph()
        bold += 1
      }
    } else if (BLOCK_BREAK.has(tag)) {
      if (!inItem) flushParagraph()
    }
    // Any other tag is ignored; its inner text still arrives as text tokens.
  }

  if (inItem) endItem()
  flushParagraph()
  flushList()
  return blocks
}
