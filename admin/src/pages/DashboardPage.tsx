import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchGearList } from "@/api/gear"
import { fetchCategoryList } from "@/api/category"
import { fetchSubscriberList } from "@/api/subscriber"
import { fetchContactList } from "@/api/contact"
import { errorMessage, isCanceled } from "@/lib/api"
import { formatDateTime, isWithinDays, truncate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import PageHeader from "@/components/common/PageHeader"
import Avatar from "@/components/common/Avatar"
import KpiCard from "@/components/common/KpiCard"
import StatusBadge from "@/components/common/StatusBadge"
import EmptyState from "@/components/common/EmptyState"
import type { Contact } from "@/types"

type Stats = {
  gear: number | null
  categories: number | null
  leadsThisWeek: number | null
  subscribers: number | null
}

const QUICK_ACTIONS = [
  { to: "/gear/new", label: "Add gear", icon: "M12 5v14M5 12h14" },
  { to: "/categories/new", label: "Add category", icon: "M4 6h16M4 12h16M4 18h10" },
  { to: "/packages/new", label: "Add package", icon: "M21 8 12 3 3 8l9 5 9-5Zm0 0v8l-9 5-9-5V8" },
  { to: "/videos", label: "Upload video", icon: "M15 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5l6 4v-11l-6 4Z" },
  { to: "/leads", label: "Review leads", icon: "M3 8l9 6 9-6M3 6h18v12H3V6Z" },
]

export default function DashboardPage() {
  usePageMeta("Dashboard")

  const { user } = useAuth()
  const toast = useToast()

  const [stats, setStats] = useState<Stats>({
    gear: null,
    categories: null,
    leadsThisWeek: null,
    subscribers: null,
  })
  const [recentLeads, setRecentLeads] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const load = async () => {
      // Totals ride along on each list endpoint's meta — limit=1 keeps them cheap.
      const [gear, categories, subscribers, leads] = await Promise.all([
        fetchGearList({ limit: 1 }, controller.signal),
        fetchCategoryList({ limit: 1 }, controller.signal),
        fetchSubscriberList({ limit: 1 }, controller.signal),
        fetchContactList({ limit: 100 }, controller.signal),
      ])

      setStats({
        gear: gear.meta?.total ?? gear.rows.length,
        categories: categories.meta?.total ?? categories.rows.length,
        subscribers: subscribers.meta?.total ?? subscribers.rows.length,
        leadsThisWeek: leads.rows.filter((lead) => isWithinDays(lead.createdAt, 7)).length,
      })
      setRecentLeads(leads.rows.slice(0, 5))
    }

    load()
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isCanceled(cause)) return
        const message = errorMessage(cause, "Could not load the dashboard")
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <Avatar
          name={user?.name ?? "Admin"}
          src={user?.image}
          className="h-14 w-14"
          textClassName="text-lg"
        />
        <div className="min-w-0">
          <p className="text-sm text-ink-500">Signed in as</p>
          <p className="truncate text-base font-semibold text-ink-950">{user?.email}</p>
          <Link to="/settings" className="text-xs font-medium text-brand-700 hover:underline">
            Edit profile
          </Link>
        </div>
      </div>

      <PageHeader
        title={`Namaste, ${user?.name?.split(" ")[0] ?? "Admin"}`}
        description="Everything your customers see on yatrikogears.com, managed from here."
        actions={
          <button type="button" className="btn-secondary" onClick={reload} disabled={loading}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        }
      />

      {error ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" className="btn-secondary btn-sm" onClick={reload}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total gear"
          value={stats.gear}
          loading={loading}
          to="/gear"
          icon="M3 20h18L12 4 3 20Zm9-9 4 7H8l4-7Z"
          hint="Published, rentable items"
        />
        <KpiCard
          label="Categories"
          value={stats.categories}
          loading={loading}
          to="/categories"
          icon="M4 6h16M4 12h16M4 18h10"
          hint="Used to group the catalogue"
        />
        <KpiCard
          label="New leads (7 days)"
          value={stats.leadsThisWeek}
          loading={loading}
          to="/leads"
          icon="M3 8l9 6 9-6M3 6h18v12H3V6Z"
          hint="Contact-form submissions"
        />
        <KpiCard
          label="Subscribers"
          value={stats.subscribers}
          loading={loading}
          to="/subscribers"
          icon="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0"
          hint="15%-off list"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">Recent leads</h2>
            <Link to="/leads" className="text-xs font-medium text-brand-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton h-9" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <EmptyState title="No leads yet" message="Contact-form submissions will show up here." />
            ) : (
              <table className="w-full min-w-[34rem] border-collapse">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="table-head">Name</th>
                    <th className="table-head">Subject</th>
                    <th className="table-head">Received</th>
                    <th className="table-head">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead._id} className="border-t border-ink-100">
                      <td className="table-cell">
                        <p className="font-medium text-ink-900">{lead.name}</p>
                        <p className="text-xs text-ink-500">{lead.email}</p>
                      </td>
                      <td className="table-cell">{truncate(lead.subject, 40)}</td>
                      <td className="table-cell whitespace-nowrap text-ink-500">
                        {formatDateTime(lead.createdAt)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge value={lead.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold text-ink-900">Quick actions</h2>
          <div className="mt-3 grid gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-800 transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-100 text-ink-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d={action.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
