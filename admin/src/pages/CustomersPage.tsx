import { useState } from "react"
import { deleteUser, fetchUserList } from "@/api/user"
import { formatDate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import { useAuth } from "@/context/AuthContext"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import Avatar from "@/components/common/Avatar"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { AdminUser } from "@/types/auth"

export default function CustomersPage() {
  usePageMeta("Customers")

  const { user: currentUser } = useAuth()
  const list = useListResource<AdminUser>(fetchUserList, { limit: 10 })
  const [selected, setSelected] = useState<string[]>([])

  const deletion = useDeleteConfirm({
    remove: deleteUser,
    entity: "account",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Customer",
      render: (person) => (
        <div className="flex items-center gap-3">
          <Avatar name={person.name} src={person.image} className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{person.name}</p>
            <p className="truncate text-xs text-ink-500">{person.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "hidden md:table-cell",
      render: (person) => <span className="whitespace-nowrap text-ink-600">{person.phone ?? "—"}</span>,
    },
    {
      key: "createdAt",
      header: "Joined",
      className: "hidden lg:table-cell",
      render: (person) => <span className="whitespace-nowrap text-ink-500">{formatDate(person.createdAt)}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (person) => <StatusBadge value={person.role} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (person) =>
        person._id === currentUser?._id ? (
          <span className="text-xs text-ink-400">You</span>
        ) : (
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([person._id], person.name)}
          >
            Delete
          </button>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Registered accounts. Deleting one also revokes its active sessions."
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(person) => person._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search by name…",
        }}
        filters={
          <select
            className="input w-auto min-w-[9rem]"
            value={list.filters.role ?? ""}
            onChange={(event) => list.setFilter("role", event.target.value)}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
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
                ids.filter((id) => id !== currentUser?._id),
                `${ids.filter((id) => id !== currentUser?._id).length} accounts`,
              )
            }
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No accounts found"
        emptyMessage="Customers who register on the public site appear here."
      />

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
