import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

/**
 * Shopping cart — persisted in localStorage so items survive page reloads.
 *
 * The cart only stores gear IDs and quantities. Prices are never stored
 * client-side — the server recomputes them from the database when the
 * booking is created.
 */

const STORAGE_KEY = "yatriko.cart"

export type CartItem = {
  gearId: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  /** Total number of individual items (sum of quantities). */
  itemCount: number
  addItem: (gearId: string, quantity?: number) => void
  removeItem: (gearId: string) => void
  updateQuantity: (gearId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Validate shape — only keep well-formed items.
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CartItem).gearId === "string" &&
        typeof (item as CartItem).quantity === "number" &&
        (item as CartItem).quantity > 0,
    )
  } catch {
    return []
  }
}

function writeStorage(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage())

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    writeStorage(next)
  }, [])

  const addItem = useCallback(
    (gearId: string, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((item) => item.gearId === gearId)
        const next = existing
          ? current.map((item) =>
              item.gearId === gearId
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          : [...current, { gearId, quantity }]
        writeStorage(next)
        return next
      })
    },
    [],
  )

  const removeItem = useCallback(
    (gearId: string) => {
      setItems((current) => {
        const next = current.filter((item) => item.gearId !== gearId)
        writeStorage(next)
        return next
      })
    },
    [],
  )

  const updateQuantity = useCallback(
    (gearId: string, quantity: number) => {
      if (quantity < 1) return
      setItems((current) => {
        const next = current.map((item) =>
          item.gearId === gearId ? { ...item, quantity } : item,
        )
        writeStorage(next)
        return next
      })
    },
    [],
  )

  const clearCart = useCallback(() => persist([]), [persist])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, addItem, removeItem, updateQuantity, clearCart }),
    [items, itemCount, addItem, removeItem, updateQuantity, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside <CartProvider>")
  return context
}
