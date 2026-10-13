import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cancelBooking, fetchAvailability, fetchMyBookings } from "@/api/booking"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import type { Booking } from "@/types"

export const bookingKeys = {
  my: ["bookings", "my"] as const,
  availability: (gearId: string, start: string, end: string) => ["availability", gearId, start, end] as const,
}

/** The signed-in customer's bookings. Disabled for guests. */
export function useMyBookings() {
  const { status } = useAuth()
  return useQuery({
    queryKey: bookingKeys.my,
    queryFn: fetchMyBookings,
    enabled: status === "authenticated",
  })
}

/**
 * Cancel with an optimistic update: the badge flips to "cancelled" at once and
 * is rolled back if the server refuses (for example, the shop already started
 * preparing the order). Booking CREATION is deliberately not optimistic: the
 * server can reject it for stock or date conflicts.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: bookingKeys.my })
      const previous = queryClient.getQueryData<Booking[]>(bookingKeys.my)
      queryClient.setQueryData<Booking[]>(bookingKeys.my, (list) =>
        list?.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b)),
      )
      return { previous }
    },
    onError: (error, _bookingId, context) => {
      if (context?.previous) queryClient.setQueryData(bookingKeys.my, context.previous)
      toast.show(errorMessage(error, "Could not cancel the booking."), "error")
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.my, (list) =>
        list?.map((b) => (b._id === updated._id ? updated : b)),
      )
      toast.show("Booking cancelled", "success")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: bookingKeys.my }),
  })
}

/** Units free for a date range. Only runs once both dates are chosen. */
export function useAvailability(gearId: string | undefined, start: string | null, end: string | null) {
  return useQuery({
    queryKey: bookingKeys.availability(gearId ?? "", start ?? "", end ?? ""),
    queryFn: () => fetchAvailability(gearId as string, start as string, end as string),
    enabled: Boolean(gearId && start && end),
    staleTime: 30_000,
  })
}
