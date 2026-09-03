import { useState } from "react"
import { deleteBooking, fetchBookingList, updateBookingStatus } from "@/api/booking"
import { errorMessage } from "@/lib/api"
import { formatDate, formatPrice } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import { useToast } from "@/context/ToastContext"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Booking, BookingStatus } from "@/types"

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  pending: "confirmed",
  confirmed: "active",
  active: "completed",
}

export default function BookingsPage() {
  usePageMeta("Bookings")

  const toast = useToast()
  const list = useListResource<Booking>(fetchBookingList, { limit: 10 })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [open, setOpen] = useState<Booking | null>(null)

  const deletion = useDeleteConfirm({
    remove: deleteBooking,
    entity: "booking",
    onDone: (deleted) => {
      setOpen(null)
      list.reloadAfterDelete(deleted)
    },
  })

  const setStatus = async (booking: Booking, status: BookingStatus) => {
    setBusyId(booking._id)
    try {
      await updateBookingStatus(booking._id, status)
      toast.success(`${booking.code} marked ${status}`)
      setOpen(null)
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this booking"))
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<Booking>[] = [
    {
      key: "code",
      header: "Booking",
      render: (booking) => (
        <button
          type="button"
          className="text-left"
          onClick={() => setOpen(booking)}
        >
          <span className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
            {booking.code}
          </span>
          <span className="block text-xs text-ink-500">{formatDate(booking.createdAt)}</span>
        </button>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (booking) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{booking.customerName}</p>
          <p className="truncate text-xs text-ink-500">{booking.customerPhone}</p>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Rental",
      className: "hidden lg:table-cell",
      render: (booking) => (
        <span className="whitespace-nowrap text-ink-600">
          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          <span className="ml-1 text-ink-400">({booking.days}d)</span>
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (booking) => (
        <span className="whitespace-nowrap font-medium text-ink-900">{formatPrice(booking.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (booking) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-40 text-right",
      render: (booking) => {
        const next = NEXT_STATUS[booking.status]
        return (
          <div className="flex justify-end gap-1">
            {next ? (
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={busyId === booking._id}
                onClick={() => void setStatus(booking, next)}
              >
                Mark {next}
              </button>
            ) : null}
            <button
              type="button"
              className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => deletion.request([booking._id], booking.code)}
            >
              Delete
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Bookings" description="Rental orders placed from the public site." />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(booking) => booking._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{
          value: list.search,
          onChange: list.setSearch,
          placeholder: "Search by booking code…",
        }}
        filters={
          <>
            <select
              className="input w-auto min-w-[9rem]"
              value={list.filters.status ?? ""}
              onChange={(event) => list.setFilter("status", event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="input w-auto min-w-[9rem]"
              value={list.filters.paymentStatus ?? ""}
              onChange={(event) => list.setFilter("paymentStatus", event.target.value)}
              aria-label="Filter by payment"
            >
              <option value="">Any payment</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
            </select>
          </>
        }
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No bookings yet"
        emptyMessage="Orders placed on the public site land here."
      />

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg animate-fade-in rounded-xl border border-ink-200 bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink-200 p-5">
              <div>
                <h2 className="text-base font-semibold text-ink-950">{open.code}</h2>
                <p className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                  <StatusBadge value={open.status} />
                  <StatusBadge value={open.paymentStatus} />
                </p>
              </div>
              <button type="button" className="btn-ghost px-2" onClick={() => setOpen(null)} aria-label="Close">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 p-5 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-500">Customer</dt>
                  <dd className="text-ink-900">{open.customerName}</dd>
                  <dd className="text-ink-600">
                    <a href={`tel:${open.customerPhone}`} className="hover:underline">{open.customerPhone}</a>
                    {" · "}
                    <a href={`mailto:${open.customerEmail}`} className="hover:underline">{open.customerEmail}</a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-500">Deliver to</dt>
                  <dd className="text-ink-900">{open.deliveryAddress || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-500">Rental period</dt>
                  <dd className="text-ink-900">
                    {formatDate(open.startDate)} → {formatDate(open.endDate)} ({open.days} days)
                  </dd>
                </div>

              </dl>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-500">Items</p>
                <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                  {open.items.map((item) => (
                    <li key={item.gear} className="flex justify-between gap-3 px-3 py-2">
                      <span className="text-ink-800">{item.name} × {item.quantity}</span>
                      <span className="text-ink-500">{formatPrice(item.pricePerDay)}/day</span>
                    </li>
                  ))}
                </ul>
              </div>

              {open.note ? (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-ink-500">Note</p>
                  <p className="rounded-lg bg-ink-50 p-3 text-ink-800">{open.note}</p>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-ink-200 pt-3">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="text-lg font-semibold text-ink-950">{formatPrice(open.total)}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200 p-4">
              {open.status !== "cancelled" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void setStatus(open, "cancelled")}
                  disabled={busyId === open._id}
                >
                  Cancel booking
                </button>
              ) : null}
              {NEXT_STATUS[open.status] ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void setStatus(open, NEXT_STATUS[open.status] as BookingStatus)}
                  disabled={busyId === open._id}
                >
                  Mark {NEXT_STATUS[open.status]}
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
