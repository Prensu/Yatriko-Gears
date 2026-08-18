import type { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  message?: string
  action?: ReactNode
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {message ? <p className="max-w-sm text-sm text-ink-500">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
