import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { createQueryClient } from "@/lib/queryClient"
import { useCancelBooking } from "@/hooks/useBookings"
import { ToastProvider } from "@/context/ToastContext"
import type { Booking } from "@/types"
import { cancelBooking } from "@/api/booking"

vi.mock("@/api/booking", () => ({
  cancelBooking: vi.fn(),
  fetchMyBookings: vi.fn(),
}))

const booking: Booking = {
  _id: "booking-1",
  code: "YG-001",
  items: [],
  days: 1,
  subtotal: 100,
  deliveryCharge: 0,
  total: 100,
  status: "pending",
  paymentStatus: "unpaid",
  deliveryAddress: "Khokana",
  customerPhone: "9800000000",
  note: "",
}

describe("booking mutations", () => {
  beforeEach(() => vi.clearAllMocks())

  it("optimistically marks a booking cancelled and replaces it with the server result", async () => {
    const serverBooking = { ...booking, status: "cancelled" as const }
    vi.mocked(cancelBooking).mockResolvedValue(serverBooking)
    const client = createQueryClient()
    const combinedWrapper = ({ children }: { children: import("react").ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    )
    client.setQueryData(["bookings", "my"], [booking])
    const cancel = renderHook(() => useCancelBooking(), { wrapper: combinedWrapper })
    await act(async () => { cancel.result.current.mutate(booking) })
    await waitFor(() => expect(cancelBooking).toHaveBeenCalledWith("booking-1"))
    expect(client.getQueryData<Booking[]>(["bookings", "my"])?.[0].status).toBe("cancelled")
  })

  it("rolls back when cancellation fails", async () => {
    const client = createQueryClient()
    client.setQueryData(["bookings", "my"], [booking])
    vi.mocked(cancelBooking).mockRejectedValue(new Error("offline"))
    const wrapperWithClient = ({ children }: { children: import("react").ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    )
    const cancel = renderHook(() => useCancelBooking(), { wrapper: wrapperWithClient })

    await act(async () => { cancel.result.current.mutate(booking) })
    await waitFor(() => expect(cancel.result.current.isError).toBe(true))
    expect(client.getQueryData<Booking[]>(["bookings", "my"])?.[0].status).toBe("pending")
  })
})
