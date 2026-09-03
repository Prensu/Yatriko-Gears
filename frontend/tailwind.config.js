/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0f7f1",
          100: "#dcebde",
          200: "#bad8c0",
          300: "#8ebd99",
          400: "#5e9c6e",
          500: "#3e7f50",
          600: "#2d653e",
          700: "#245133",
          800: "#1e412a",
          900: "#193623",
          950: "#0d1e13",
        },
        navy: {
          800: "#1e2a3a",
          900: "#141d29",
          950: "#0c121b",
        },
        sand: "#f7f5f0",
      },
      fontFamily: {
        display: ["'Poppins'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        script: ["'Caveat'", "cursive"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-0.5rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 50s linear infinite",
        "toast-in": "toast-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
}
