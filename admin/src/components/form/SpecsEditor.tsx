import { useState } from "react"

type SpecsEditorProps = {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
}

type Pair = {
  id: number
  key: string
  value: string
}

let nextPairId = 1

function toPairs(record: Record<string, string>): Pair[] {
  return Object.entries(record).map(([key, value]) => ({ id: nextPairId++, key, value }))
}

function toRecord(pairs: Pair[]): Record<string, string> {
  const record: Record<string, string> = {}
  for (const pair of pairs) {
    const key = pair.key.trim()
    if (key) record[key] = pair.value
  }
  return record
}

/**
 * Key/value editor for gear `specs` (a Mongoose Map on the backend).
 *
 * Rows are held locally so half-typed keys don't vanish; the parent gets a
 * clean record on every keystroke. Mount with a `key` that changes when the
 * edited document loads, so the initial rows come from the server data.
 */
export default function SpecsEditor({ value, onChange }: SpecsEditorProps) {
  const [pairs, setPairs] = useState<Pair[]>(() => toPairs(value))

  const update = (next: Pair[]) => {
    setPairs(next)
    onChange(toRecord(next))
  }

  return (
    <div className="space-y-2">
      {pairs.map((pair, index) => (
        <div key={pair.id} className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            value={pair.key}
            placeholder="Weight"
            aria-label={`Spec name ${index + 1}`}
            onChange={(event) =>
              update(pairs.map((entry) => (entry.id === pair.id ? { ...entry, key: event.target.value } : entry)))
            }
          />
          <input
            type="text"
            className="input flex-1"
            value={pair.value}
            placeholder="2.4 kg"
            aria-label={`Spec value ${index + 1}`}
            onChange={(event) =>
              update(pairs.map((entry) => (entry.id === pair.id ? { ...entry, value: event.target.value } : entry)))
            }
          />
          <button
            type="button"
            className="btn-ghost shrink-0 px-2"
            onClick={() => update(pairs.filter((entry) => entry.id !== pair.id))}
            aria-label={`Remove spec ${index + 1}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={() => update([...pairs, { id: nextPairId++, key: "", value: "" }])}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Add spec
      </button>
    </div>
  )
}
