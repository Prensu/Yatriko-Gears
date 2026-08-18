import { motion } from "framer-motion"

/**
 * "Trusted by brands across Nepal" logo marquee.
 * Auto-discovers every logo dropped into src/assets/brands/ — no code changes needed.
 */
const logos = Object.entries(
  import.meta.glob("../../assets/brands/*.{png,jpg,jpeg,svg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).map(([path, url]) => {
  const file = path.split("/").pop() ?? ""
  const name = file
    .replace(/\.(png|jpe?g|svg|webp)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { name, url: url as string }
})

export default function BrandMarquee() {
  if (logos.length === 0) return null
  const doubled = [...logos, ...logos]
  return (
    <section className="border-y border-slate-100 bg-white py-12">
      <p className="text-center font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
        Trusted by brands across Nepal
      </p>
      <div className="relative mt-8 overflow-hidden">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <motion.div
          className="flex w-max gap-16 px-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 50, ease: "linear", repeat: Infinity }}
        >
          {doubled.map((logo, i) => (
            <img
              key={`${logo.name}-${i}`}
              src={logo.url}
              alt={logo.name}
              title={logo.name}
              loading="lazy"
              className="h-14 w-auto object-contain mix-blend-multiply transition duration-300 hover:scale-105"
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
