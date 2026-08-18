import { useCallback, useState } from "react"
import { errorMessage } from "@/lib/api"
import { useToast } from "@/context/ToastContext"

type DeleteTarget = {
  ids: string[]
  label: string
}

type Options = {
  /** Deletes one record by its identifier (slug for content, _id for people). */
  remove: (id: string) => Promise<unknown>
  /** Singular noun used in the confirmation copy, e.g. "gear item". */
  entity: string
  onDone?: (deletedCount: number) => void
}

/**
 * Shared delete flow: ask through ConfirmModal, run one or many deletions,
 * then report the outcome with a toast. Bulk deletes report partial success.
 */
export function useDeleteConfirm({ remove, entity, onDone }: Options) {
  const toast = useToast()
  const [target, setTarget] = useState<DeleteTarget | null>(null)
  const [busy, setBusy] = useState(false)

  const request = useCallback((ids: string[], label: string) => {
    if (ids.length > 0) setTarget({ ids, label })
  }, [])

  const cancel = useCallback(() => {
    if (!busy) setTarget(null)
  }, [busy])

  const confirm = useCallback(async () => {
    if (!target) return
    setBusy(true)

    const results = await Promise.allSettled(target.ids.map((id) => remove(id)))
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    const succeeded = results.length - rejected.length

    if (succeeded > 0) {
      toast.success(
        succeeded === 1 ? `Deleted ${target.label}` : `Deleted ${succeeded} ${entity}s`,
      )
    }
    if (rejected.length > 0) {
      toast.error(errorMessage(rejected[0].reason, `Could not delete this ${entity}`))
    }

    setBusy(false)
    setTarget(null)
    onDone?.(succeeded)
  }, [target, remove, entity, onDone, toast])

  const count = target?.ids.length ?? 0

  return {
    request,
    busy,
    modalProps: {
      open: Boolean(target),
      title: count > 1 ? `Delete ${count} ${entity}s?` : `Delete this ${entity}?`,
      message:
        count > 1
          ? `${count} ${entity}s will be permanently removed. This cannot be undone.`
          : `“${target?.label ?? ""}” will be permanently removed. This cannot be undone.`,
      confirmLabel: busy ? "Deleting…" : "Delete",
      danger: true,
      loading: busy,
      onConfirm: () => void confirm(),
      onCancel: cancel,
    },
  }
}
