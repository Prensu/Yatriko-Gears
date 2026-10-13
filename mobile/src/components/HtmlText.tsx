import { useMemo } from "react"
import { Platform, StyleSheet, Text, View } from "react-native"
import { parseHtml, type Inline } from "@/lib/parseHtml"
import { openSafeUrl } from "@/lib/links"
import { colors } from "@/theme"

type Props = {
  html: string
  color?: string
  linkColor?: string
  size?: number
}

/** Renders the chat bot's sanitised HTML as native text. See lib/parseHtml.ts. */
export function HtmlText({ html, color = colors.text, linkColor = colors.forest600, size = 15 }: Props) {
  const blocks = useMemo(() => parseHtml(html), [html])
  const lineHeight = Math.round(size * 1.45)

  const renderInlines = (inlines: Inline[], keyPrefix: string, heading = false) =>
    inlines.map((inline, i) => {
      const key = `${keyPrefix}-${i}`
      if (inline.kind === "br") return <Text key={key}>{"\n"}</Text>
      const { href } = inline
      return (
        <Text
          key={key}
          onPress={href ? () => void openSafeUrl(href) : undefined}
          style={[
            (inline.bold || heading) && styles.bold,
            inline.italic && styles.italic,
            inline.code && styles.code,
            href ? { color: linkColor, textDecorationLine: "underline" } : null,
          ]}
        >
          {inline.text}
        </Text>
      )
    })

  return (
    <View style={styles.wrap}>
      {blocks.map((block, bi) => {
        if (block.kind === "paragraph") {
          return (
            <Text key={bi} selectable style={{ color, fontSize: size, lineHeight }}>
              {renderInlines(block.inlines, `p${bi}`, block.heading)}
            </Text>
          )
        }
        return (
          <View key={bi} style={styles.list}>
            {block.items.map((item, ii) => (
              <View key={ii} style={styles.item}>
                <Text style={{ color, fontSize: size, lineHeight, minWidth: 18 }}>{block.ordered ? `${ii + 1}.` : "•"}</Text>
                <Text selectable style={{ color, fontSize: size, lineHeight, flex: 1 }}>
                  {renderInlines(item, `l${bi}-${ii}`)}
                </Text>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  list: { gap: 4 },
  item: { flexDirection: "row", gap: 6 },
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  code: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    backgroundColor: "rgba(0,0,0,0.06)",
  },
})
