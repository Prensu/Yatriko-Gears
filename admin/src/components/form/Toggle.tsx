type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-brand-600" : "bg-ink-300"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description ? <span className="block text-xs text-ink-500">{description}</span> : null}
      </span>
    </label>
  )
}
