import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Shopping cart, persisted in AsyncStorage so it survives app restarts.
 *
 * Same rule as the web cart: only gear ids and quantities are stored. Prices
 * are never kept on the device. The server recomputes them from the database
 * when the booking is created.
 */
const STORAGE_KEY = "yatriko.cart"

export type CartMode = "rent" | "sale"

export type CartItem = {
  gearId: string
  quantity: number
  mode: CartMode
  color?: string
}

type CartContextValue = {
  items: CartItem[]
  /** False until the saved cart has been read from storage. */
  ready: boolean
  /** Total number of individual items (sum of quantities). */
  itemCount: number
  addItem: (gearId: string, quantity?: number, mode?: CartMode, color?: string) => void
  removeItem: (gearId: string, mode: CartMode, color?: string) => void
  updateQuantity: (gearId: string, mode: CartMode, quantity: number, color?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const MAX_PER_ITEM = 20 // the backend rejects more than 20 per line

const same = (item: CartItem, gearId: string, mode: CartMode, color?: string) =>
  item.gearId === gearId && item.mode === mode && (item.color ?? "") === (color ?? "")

function parseStored(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const items: CartItem[] = []
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue
      const { gearId, quantity, mode, color } = entry as Record<string, unknown>
      if (typeof gearId !== "string" || typeof quantity !== "number" || quantity < 1) continue
      items.push({
        gearId,
        quantity: Math.min(Math.floor(quantity), MAX_PER_ITEM),
        mode: mode === "sale" ? "sale" : "rent",
        ...(typeof color === "string" && color ? { color } : {}),
      })
    }
    return items
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) setItems(parseStored(raw))
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist after hydration only, otherwise the empty initial state would overwrite the saved cart.
  useEffect(() => {
    if (!ready) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined)
  }, [items, ready])

  const addItem = useCallback((gearId: string, quantity = 1, mode: CartMode = "rent", color?: string) => {
    setItems((current) => {
      const existing = current.find((item) => same(item, gearId, mode, color))
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_PER_ITEM) } : item,
        )
      }
      return [...current, { gearId, quantity: Math.min(quantity, MAX_PER_ITEM), mode, ...(color ? { color } : {}) }]
    })
  }, [])

  const removeItem = useCallback((gearId: string, mode: CartMode, color?: string) => {
    setItems((current) => current.filter((item) => !same(item, gearId, mode, color)))
  }, [])

  const updateQuantity = useCallback((gearId: string, mode: CartMode, quantity: number, color?: string) => {
    if (quantity < 1) return
    setItems((current) =>
      current.map((item) =>
        same(item, gearId, mode, color) ? { ...item, quantity: Math.min(quantity, MAX_PER_ITEM) } : item,
      ),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const value = useMemo<CartContextValue>(
    () => ({ items, ready, itemCount, addItem, removeItem, updateQuantity, clearCart }),
    [items, ready, itemCount, addItem, removeItem, updateQuantity, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside <CartProvider>")
  return context
}
