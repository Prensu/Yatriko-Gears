/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Muted forest accent — a desaturated cousin of the public site's palette.
        brand: {
          50: "#f2f6f3",
          100: "#e2ebe4",
          200: "#c6d7ca",
          300: "#9fbaa6",
          400: "#74977e",
          500: "#527a5e",
          600: "#3e6149",
          700: "#334e3b",
          800: "#2a3f31",
          900: "#23342a",
          950: "#111d16",
        },
        // Neutral chrome for sidebar/topbar/table surfaces.
        ink: {
          50: "#f7f8f8",
          100: "#eef0f1",
          200: "#dcdfe2",
          300: "#bcc2c7",
          400: "#939ca4",
          500: "#737d86",
          600: "#5c646c",
          700: "#4b5158",
          800: "#40454a",
          900: "#383c40",
          950: "#1c1f22",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
}
