type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: "left" | "center"
}

export default function SectionHeading({ eyebrow, title, subtitle, align = "center" }: Props) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left"
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow && <p className="font-script text-2xl text-forest-600">{eyebrow}</p>}
      <h2 className="mt-1 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-500">{subtitle}</p>}
    </div>
  )
}
