import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cancelBooking, fetchMyBookings } from "@/api/booking"
import { ApiRequestError } from "@/lib/api"
import { useToast } from "@/context/ToastContext"
import type { Booking } from "@/types"

export const bookingKeys = {
  my: ["bookings", "my"] as const,
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.my,
    queryFn: fetchMyBookings,
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (booking: Booking) => cancelBooking(booking._id),
    onMutate: async (booking) => {
      await queryClient.cancelQueries({ queryKey: bookingKeys.my })
      const previous = queryClient.getQueryData<Booking[]>(bookingKeys.my)

      queryClient.setQueryData<Booking[]>(bookingKeys.my, (current) =>
        current?.map((item) =>
          item._id === booking._id ? { ...item, status: "cancelled" } : item,
        ),
      )

      return { previous }
    },
    onError: (cause, booking, context) => {
      // Restore only the affected booking so two quick cancellations do not
      // roll back each other's optimistic state.
      const previousBooking = context?.previous?.find((item) => item._id === booking._id)
      if (previousBooking) {
        queryClient.setQueryData<Booking[]>(bookingKeys.my, (current) =>
          current?.map((item) => (item._id === booking._id ? previousBooking : item)),
        )
      } else if (context?.previous) {
        queryClient.setQueryData(bookingKeys.my, context.previous)
      }

      toast.error(
        cause instanceof ApiRequestError
          ? cause.message
          : "Could not cancel this booking",
      )
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.my, (current) =>
        current?.map((item) => (item._id === updated._id ? updated : item)) ?? [updated],
      )
      toast.success("Booking cancelled")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.my })
    },
  })
}
