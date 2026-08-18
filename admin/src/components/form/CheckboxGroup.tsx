type Option = {
  value: string
  label: string
}

type CheckboxGroupProps = {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  name: string
}

export default function CheckboxGroup({ options, value, onChange, name }: CheckboxGroupProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) onChange(value.filter((entry) => entry !== option))
    else onChange([...value, option])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value.includes(option.value)
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
              checked
                ? "border-brand-300 bg-brand-50 text-brand-800"
                : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
            }`}
          >
            <input
              type="checkbox"
              name={name}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={checked}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}
