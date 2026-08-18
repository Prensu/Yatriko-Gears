import { useState } from "react"
import { deleteContact, fetchContactList, updateContactStatus } from "@/api/contact"
import { errorMessage } from "@/lib/api"
import { formatDateTime, truncate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import { useToast } from "@/context/ToastContext"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Contact, LeadStatus } from "@/types"

export default function LeadsPage() {
  usePageMeta("Leads")

  const toast = useToast()
  const list = useListResource<Contact>(fetchContactList, { limit: 10 })
  const [selected, setSelected] = useState<string[]>([])
  const [openLead, setOpenLead] = useState<Contact | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const deletion = useDeleteConfirm({
    remove: deleteContact,
    entity: "lead",
    onDone: (deleted) => {
      setSelected([])
      setOpenLead(null)
      list.reloadAfterDelete(deleted)
    },
  })

  const setStatus = async (ids: string[], status: LeadStatus) => {
    setUpdatingId(ids[0] ?? null)
    const results = await Promise.allSettled(ids.map((id) => updateContactStatus(id, status)))
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    const succeeded = results.length - rejected.length

    if (succeeded > 0) {
      toast.success(
        succeeded === 1 ? `Lead marked as ${status}` : `${succeeded} leads marked as ${status}`,
      )
    }
    if (rejected.length > 0) {
      toast.error(errorMessage(rejected[0].reason, "Could not update this lead"))
    }

    setUpdatingId(null)
    setSelected([])
    setOpenLead(null)
    list.reload()
  }

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "From",
      render: (lead) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{lead.name}</p>
          <p className="truncate text-xs text-ink-500">{lead.email}</p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (lead) => (
        <button
          type="button"
          className="text-left text-ink-800 hover:text-brand-700 hover:underline"
          onClick={() => setOpenLead(lead)}
        >
          {truncate(lead.subject, 46)}
        </button>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "hidden lg:table-cell",
      render: (lead) => <span className="whitespace-nowrap text-ink-600">{lead.phone}</span>,
    },
    {
      key: "createdAt",
      header: "Received",
      className: "hidden md:table-cell",
      render: (lead) => <span className="whitespace-nowrap text-ink-500">{formatDateTime(lead.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (lead) => <StatusBadge value={lead.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-44 text-right",
      render: (lead) => (
        <div className="flex justify-end gap-1">
          {lead.status !== "resolved" ? (
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={updatingId === lead._id}
              onClick={() => void setStatus([lead._id], "resolved")}
            >
              Mark handled
            </button>
          ) : null}
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([lead._id], lead.subject)}
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
        title="Leads"
        description="Contact-form submissions from the public site."
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(lead) => lead._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search by subject…",
        }}
        filters={
          <select
            className="input w-auto min-w-[9rem]"
            value={list.filters.status ?? ""}
            onChange={(event) => list.setFilter("status", event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        }
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={(ids) => (
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void setStatus(ids, "read")}>
              Mark read
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void setStatus(ids, "resolved")}>
              Mark handled
            </button>
            <button
              type="button"
              className="btn-danger btn-sm"
              onClick={() => deletion.request(ids, `${ids.length} leads`)}
            >
              Delete selected
            </button>
          </>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No leads yet"
        emptyMessage="Submissions from the contact form land here."
      />

      {openLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpenLead(null)} aria-hidden="true" />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg animate-fade-in rounded-xl border border-ink-200 bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink-200 p-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink-950">{openLead.subject}</h2>
                <p className="mt-1 text-xs text-ink-500">
                  {formatDateTime(openLead.createdAt)} · <StatusBadge value={openLead.status} />
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost px-2"
                onClick={() => setOpenLead(null)}
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 p-5">
              <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-500">Name</dt>
                  <dd className="text-ink-900">{openLead.name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-500">Email</dt>
                  <dd className="truncate">
                    <a href={`mailto:${openLead.email}`} className="text-brand-700 hover:underline">
                      {openLead.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-500">Phone</dt>
                  <dd>
                    <a href={`tel:${openLead.phone}`} className="text-brand-700 hover:underline">
                      {openLead.phone}
                    </a>
                  </dd>
                </div>
              </dl>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-500">Message</p>
                <p className="whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-sm leading-relaxed text-ink-800">
                  {openLead.message}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200 p-4">
              <button
                type="button"
                className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => deletion.request([openLead._id], openLead.subject)}
              >
                Delete
              </button>
              {openLead.status === "new" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void setStatus([openLead._id], "read")}
                >
                  Mark read
                </button>
              ) : null}
              {openLead.status !== "resolved" ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void setStatus([openLead._id], "resolved")}
                >
                  Mark handled
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
