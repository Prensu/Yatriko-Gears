import { Link } from "react-router-dom"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function NotFoundPage() {
  usePageMeta("Not found")

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-4xl font-semibold text-ink-300">404</p>
      <h1 className="text-lg font-semibold text-ink-900">This screen does not exist</h1>
      <p className="max-w-sm text-sm text-ink-500">
        The link may be out of date. Head back to the dashboard and try again.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  )
}
