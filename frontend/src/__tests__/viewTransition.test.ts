import { describe, expect, it, vi, beforeEach } from "vitest"
import { navigateWithTransition, supportsViewTransitions } from "@/lib/viewTransition"

describe("view transitions", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    })
  })

  it("falls back to normal navigation when the API is unavailable", () => {
    const navigate = vi.fn()
    expect(supportsViewTransitions()).toBe(false)
    navigateWithTransition(navigate, "/gear/example")
    expect(navigate).toHaveBeenCalledWith("/gear/example", {})
  })

  it("respects reduced motion", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    })
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: vi.fn(),
    })
    expect(supportsViewTransitions()).toBe(false)
  })

  it("clears the shared image name after the transition finishes", async () => {
    let finish!: () => void
    const finished = new Promise<void>((resolve) => { finish = resolve })
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: vi.fn((callback: () => void) => {
        callback()
        return { finished }
      }),
    })
    const image = document.createElement("img")
    const navigate = vi.fn()

    navigateWithTransition(navigate, "/gear/example", { sharedElement: image })
    expect(image.style.viewTransitionName).toBe("gear-image")
    finish()
    await finished
    await Promise.resolve()
    expect(image.style.viewTransitionName).toBe("")
  })
})
