import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { CartProvider, useCart } from "@/context/CartContext"

describe("cart color selections", () => {
  beforeEach(() => localStorage.clear())

  it("keeps colors separate, updates only the chosen color and persists across reloads", () => {
    const cart = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => {
      cart.result.current.addItem("chair", 1, "sale", "Red")
      cart.result.current.addItem("chair", 2, "sale", "Blue")
      cart.result.current.addItem("chair", 1, "sale", "Red")
    })
    expect(cart.result.current.items).toEqual([
      { gearId: "chair", quantity: 2, mode: "sale", color: "Red" },
      { gearId: "chair", quantity: 2, mode: "sale", color: "Blue" },
    ])
    act(() => cart.result.current.updateQuantity("chair", "sale", 3, "Red"))
    cart.unmount()
    const reloaded = renderHook(() => useCart(), { wrapper: CartProvider })
    expect(reloaded.result.current.items.map((item) => [item.color, item.quantity])).toEqual([["Red", 3], ["Blue", 2]])
    act(() => reloaded.result.current.removeItem("chair", "sale", "Red"))
    expect(reloaded.result.current.items).toEqual([{ gearId: "chair", quantity: 2, mode: "sale", color: "Blue" }])
  })
})
