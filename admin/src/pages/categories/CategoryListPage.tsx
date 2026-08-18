import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { deleteCategory, fetchCategoryList } from "@/api/category"
import { formatDate, truncate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Category } from "@/types"

export default function CategoryListPage() {
  usePageMeta("Categories")

  const list = useListResource<Category>(fetchCategoryList, { limit: 10 })
  const [selected, setSelected] = useState<string[]>([])

  const slugById = useMemo(() => {
    const map = new Map<string, string>()
    list.rows.forEach((category) => map.set(category._id, category.slug))
    return map
  }, [list.rows])

  const deletion = useDeleteConfirm({
    remove: deleteCategory,
    entity: "category",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Category",
      render: (category) => (
        <div className="flex items-center gap-3">
          {category.image ? (
            <img src={category.image} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{category.name}</p>
            <p className="truncate text-xs text-ink-500">{category.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "hidden md:table-cell",
      render: (category) => (
        <span className="text-ink-600">
          {category.description ? truncate(category.description, 60) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      className: "hidden lg:table-cell",
      render: (category) => <span className="whitespace-nowrap text-ink-500">{formatDate(category.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (category) => <StatusBadge value={category.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (category) => (
        <div className="flex justify-end gap-1">
          <Link to={`/categories/${encodeURIComponent(category.slug)}/edit`} className="btn-secondary btn-sm">
            Edit
          </Link>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([category.slug], category.name)}
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
        title="Categories"
        description="Groups that organise the gear catalogue."
        actions={
          <Link to="/categories/new" className="btn-primary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add category
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(category) => category._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search categories…",
        }}
        filters={
          <select
            className="input w-auto min-w-[9rem]"
            value={list.filters.status ?? ""}
            onChange={(event) => list.setFilter("status", event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
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
                `${ids.length} categories`,
              )
            }
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No categories yet"
        emptyMessage="Categories power the filter on the public gear page."
        emptyAction={
          <Link to="/categories/new" className="btn-primary btn-sm">
            Add category
          </Link>
        }
      />

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
