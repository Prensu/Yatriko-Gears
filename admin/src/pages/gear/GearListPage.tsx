import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { deleteGear, fetchGearList } from "@/api/gear"
import { fetchCategoryOptions } from "@/api/category"
import { isCanceled } from "@/lib/api"
import { formatPrice } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Category, Gear } from "@/types"

export default function GearListPage() {
  usePageMeta("Gear")

  const list = useListResource<Gear>(fetchGearList, { limit: 10 })
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string[]>([])

  // slug is the delete/edit key, but rows are selected by _id.
  const slugById = useMemo(() => {
    const map = new Map<string, string>()
    list.rows.forEach((gear) => map.set(gear._id, gear.slug))
    return map
  }, [list.rows])

  const deletion = useDeleteConfirm({
    remove: deleteGear,
    entity: "gear item",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  useEffect(() => {
    const controller = new AbortController()
    fetchCategoryOptions(controller.signal)
      .then(setCategories)
      .catch((error: unknown) => {
        if (!isCanceled(error)) setCategories([])
      })
    return () => controller.abort()
  }, [])

  const columns: Column<Gear>[] = [
    {
      key: "name",
      header: "Item",
      render: (gear) => (
        <div className="flex items-center gap-3">
          {gear.image ? (
            <img src={gear.image} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 20h18L12 4 3 20Z" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{gear.name}</p>
            <p className="truncate text-xs text-ink-500">{gear.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "hidden md:table-cell",
      render: (gear) => <span className="text-ink-600">{gear.category?.name ?? "—"}</span>,
    },
    {
      key: "price",
      header: "Price / day",
      render: (gear) => (
        <div className="whitespace-nowrap">
          <span className="font-medium text-ink-900">{formatPrice(gear.discountedPrice)}</span>
          {gear.discountedPrice < gear.realPrice ? (
            <span className="ml-1.5 text-xs text-ink-400 line-through">{formatPrice(gear.realPrice)}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "availableFor",
      header: "Available for",
      className: "hidden lg:table-cell",
      render: (gear) => (
        <div className="flex flex-wrap gap-1">
          {gear.availableFor.map((mode) => (
            <span key={mode} className="rounded bg-ink-100 px-1.5 py-0.5 text-xs capitalize text-ink-600">
              {mode}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (gear) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={gear.status} />
          {gear.isNew ? <StatusBadge value="new" /> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (gear) => (
        <div className="flex justify-end gap-1">
          <Link to={`/gear/${encodeURIComponent(gear.slug)}/edit`} className="btn-secondary btn-sm">
            Edit
          </Link>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([gear.slug], gear.name)}
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
        title="Gear"
        description="The rental catalogue shown on the public site."
        actions={
          <Link to="/gear/new" className="btn-primary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add gear
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(gear) => gear._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search gear by name…",
        }}
        filters={
          <select
            className="input w-auto min-w-[10rem]"
            value={list.filters.category ?? ""}
            onChange={(event) => list.setFilter("category", event.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
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
                `${ids.length} gear items`,
              )
            }
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No gear found"
        emptyMessage="Try a different search, or add your first item."
        emptyAction={
          <Link to="/gear/new" className="btn-primary btn-sm">
            Add gear
          </Link>
        }
      />

      <p className="mt-3 text-xs text-ink-400">
        Note: <code className="rounded bg-ink-100 px-1">GET /gear</code> is the public catalogue
        endpoint and only returns <strong>active</strong> items, so anything set to inactive drops
        out of this list.
      </p>

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
