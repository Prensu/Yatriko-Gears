import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { deletePackage, fetchPackageList } from "@/api/package"
import { formatPrice, truncate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Package } from "@/types"

export default function PackageListPage() {
  usePageMeta("Packages")

  const list = useListResource<Package>(fetchPackageList, { limit: 10 })
  const [selected, setSelected] = useState<string[]>([])

  const slugById = useMemo(() => {
    const map = new Map<string, string>()
    list.rows.forEach((pkg) => map.set(pkg._id, pkg.slug))
    return map
  }, [list.rows])

  const deletion = useDeleteConfirm({
    remove: deletePackage,
    entity: "package",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  const columns: Column<Package>[] = [
    {
      key: "name",
      header: "Package",
      render: (pkg) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{pkg.name}</p>
          <p className="truncate text-xs text-ink-500">{pkg.slug}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      className: "hidden md:table-cell",
      render: (pkg) => (
        <div className="flex flex-wrap gap-1">
          {pkg.items.slice(0, 3).map((item) => (
            <span key={item} className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">
              {truncate(item, 22)}
            </span>
          ))}
          {pkg.items.length > 3 ? (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-500">
              +{pkg.items.length - 3}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (pkg) => <span className="whitespace-nowrap font-medium text-ink-900">{formatPrice(pkg.price)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (pkg) => <StatusBadge value={pkg.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (pkg) => (
        <div className="flex justify-end gap-1">
          <Link to={`/packages/${encodeURIComponent(pkg.slug)}/edit`} className="btn-secondary btn-sm">
            Edit
          </Link>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([pkg.slug], pkg.name)}
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
        title="Packages"
        description="Bundles of gear sold as one combo on the public site."
        actions={
          <Link to="/packages/new" className="btn-primary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add package
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(pkg) => pkg._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search packages…",
        }}
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
                `${ids.length} packages`,
              )
            }
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No packages yet"
        emptyMessage="Bundle popular gear together at a combo price."
        emptyAction={
          <Link to="/packages/new" className="btn-primary btn-sm">
            Add package
          </Link>
        }
      />

      <p className="mt-3 text-xs text-ink-400">
        Note: <code className="rounded bg-ink-100 px-1">GET /package</code> only returns{" "}
        <strong>active</strong> packages, so inactive ones drop out of this list.
      </p>

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
