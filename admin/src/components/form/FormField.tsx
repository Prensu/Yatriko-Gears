import type { ReactNode } from "react"

type FormFieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}

/** Label + control + inline Zod error, used by every form in the CMS. */
export default function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>

      {children}

      {error ? (
        <p className="field-error" role="alert">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}
