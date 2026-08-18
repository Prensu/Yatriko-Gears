type SpinnerProps = {
  className?: string
  label?: string
}

/** Inline loading indicator — used inside buttons and full-page loaders. */
export default function Spinner({ className = "h-4 w-4", label }: SpinnerProps) {
  return (
    <>
      <svg
        className={`animate-spin ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  )
}
