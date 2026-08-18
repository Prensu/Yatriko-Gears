import { initials } from "@/lib/format"

type AvatarProps = {
  name: string
  src?: string
  /** Tailwind size classes, e.g. "h-8 w-8". */
  className?: string
  textClassName?: string
}

/** Profile photo when there is one, initials when there isn't. */
export default function Avatar({
  name,
  src = "",
  className = "h-8 w-8",
  textClassName = "text-xs",
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-ink-200`}
      />
    )
  }

  return (
    <span
      className={`${className} ${textClassName} flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
