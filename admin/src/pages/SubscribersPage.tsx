import { useState } from "react"
import { deleteSubscriber, fetchAllSubscribers, fetchSubscriberList } from "@/api/subscriber"
import { errorMessage } from "@/lib/api"
import { downloadCsv, toCsv } from "@/lib/csv"
import { formatDateTime } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import { useToast } from "@/context/ToastContext"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import ConfirmModal from "@/components/common/ConfirmModal"
import Spinner from "@/components/common/Spinner"
import type { Subscriber } from "@/types"

export default function SubscribersPage() {
  usePageMeta("Subscribers")

  const toast = useToast()
  const list = useListResource<Subscriber>(fetchSubscriberList, { limit: 10 })
  const [selected, setSelected] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)

  const deletion = useDeleteConfirm({
    remove: deleteSubscriber,
    entity: "subscriber",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  /** Walks every page so the CSV is the whole list, not just this screen. */
  const exportCsv = async () => {
    setExporting(true)
    try {
      const rows = await fetchAllSubscribers(list.search || undefined)
      if (rows.length === 0) {
        toast.info("Nothing to export yet")
        return
      }

      const csv = toCsv(rows, [
        { header: "Email", value: (row) => row.email },
        { header: "Source", value: (row) => row.source },
        { header: "Subscribed at", value: (row) => row.createdAt ?? "" },
      ])
      downloadCsv(`yatriko-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, csv)
      toast.success(`Exported ${rows.length} subscribers`)
    } catch (error) {
      toast.error(errorMessage(error, "Could not export the subscriber list"))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<Subscriber>[] = [
    {
      key: "email",
      header: "Email",
      render: (subscriber) => (
        <a href={`mailto:${subscriber.email}`} className="font-medium text-ink-900 hover:text-brand-700">
          {subscriber.email}
        </a>
      ),
    },
    {
      key: "source",
      header: "Source",
      className: "hidden md:table-cell",
      render: (subscriber) => (
        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">
          {subscriber.source || "unknown"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Subscribed",
      render: (subscriber) => (
        <span className="whitespace-nowrap text-ink-500">{formatDateTime(subscriber.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (subscriber) => (
        <button
          type="button"
          className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => deletion.request([subscriber._id], subscriber.email)}
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Subscribers"
        description="Emails captured by the 15%-off lead modal."
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(subscriber) => subscriber._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search by email…",
        }}
        toolbarActions={
          <button type="button" className="btn-secondary" onClick={() => void exportCsv()} disabled={exporting}>
            {exporting ? (
              <Spinner />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Export CSV
          </button>
        }
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={(ids) => (
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() => deletion.request(ids, `${ids.length} subscribers`)}
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No subscribers yet"
        emptyMessage="The lead-capture modal on the public site feeds this list."
      />

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
