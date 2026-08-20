import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { deleteDestination, fetchDestinationList } from "@/api/destination"
import { truncate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Destination } from "@/types"

export default function DestinationListPage() {
  usePageMeta("Destinations")

  const list = useListResource<Destination>(fetchDestinationList, { limit: 10, initialFilters: { status: "all" } })
  const [selected, setSelected] = useState<string[]>([])

  const slugById = useMemo(() => {
    const map = new Map<string, string>()
    list.rows.forEach((destination) => map.set(destination._id, destination.slug))
    return map
  }, [list.rows])

  const deletion = useDeleteConfirm({
    remove: deleteDestination,
    entity: "destination",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  const columns: Column<Destination>[] = [
    {
      key: "name",
      header: "Destination",
      render: (destination) => (
        <div className="flex items-center gap-3">
          {destination.image ? (
            <img src={destination.image} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{destination.name}</p>
            <p className="truncate text-xs text-ink-500">{destination.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "blurb",
      header: "Blurb",
      className: "hidden md:table-cell",
      render: (destination) => (
        <span className="text-ink-600">{destination.blurb ? truncate(destination.blurb, 70) : "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (destination) => <StatusBadge value={destination.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (destination) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/destinations/${encodeURIComponent(destination.slug)}/edit`}
            className="btn-secondary btn-sm"
          >
            Edit
          </Link>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([destination.slug], destination.name)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Destinations"
        description="Camping spots featured on the public site."
        actions={
          <Link to="/destinations/new" className="btn-primary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add destination
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(destination) => destination._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search destinations…",
        }}
        filters={
            <select
              className="input w-auto min-w-[9rem]"
              value={list.filters.status ?? "all"}
              onChange={(event) => list.setFilter("status", event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
        }
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={(ids) => (
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() =>
              deletion.request(
                ids.map((id) => slugById.get(id)).filter((slug): slug is string => Boolean(slug)),
                `${ids.length} destinations`,
              )
            }
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No destinations yet"
        emptyMessage="Add the camping spots you run trips to."
        emptyAction={
          <Link to="/destinations/new" className="btn-primary btn-sm">
            Add destination
          </Link>
        }
      />


      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
