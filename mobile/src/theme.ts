/** Design tokens, mirroring the web site's Tailwind palette (forest / navy / sand). */
export const colors = {
  forest50: "#f0f7f1",
  forest100: "#dcebde",
  forest200: "#bad8c0",
  forest300: "#8ebd99",
  forest400: "#5e9c6e",
  forest500: "#3e7f50",
  forest600: "#2d653e",
  forest700: "#245133",
  forest800: "#1e412a",
  forest900: "#193623",
  navy800: "#1e2a3a",
  navy900: "#141d29",
  sand: "#f7f5f0",
  white: "#ffffff",
  text: "#141d29",
  textMuted: "#5b6573",
  textFaint: "#8a93a0",
  border: "#e4e1d9",
  danger: "#c0392b",
  dangerBg: "#fdecea",
  warning: "#b7791f",
  warningBg: "#fdf3dc",
  success: "#2d653e",
  successBg: "#dcebde",
  info: "#1f5f8b",
  infoBg: "#e3f0f9",
  whatsapp: "#25d366",
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const

export const font = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const

export const shadow = {
  card: {
    shadowColor: "#0c121b",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const
