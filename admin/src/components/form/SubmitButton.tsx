import type { ReactNode } from "react"
import Spinner from "@/components/common/Spinner"

type SubmitButtonProps = {
  loading?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
  type?: "submit" | "button"
  onClick?: () => void
}

/** Primary action button that disables itself and spins while submitting. */
export default function SubmitButton({
  loading = false,
  disabled = false,
  children,
  className = "btn-primary",
  type = "submit",
  onClick,
}: SubmitButtonProps) {
  return (
    <button type={type} className={className} disabled={loading || disabled} onClick={onClick}>
      {loading ? <Spinner label="Working…" /> : null}
      {children}
    </button>
  )
}
