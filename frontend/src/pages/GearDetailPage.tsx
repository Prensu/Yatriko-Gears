import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchGear, fetchGearBySlug } from "@/api/gear"
import type { Gear } from "@/types"
import { resolveGearImage } from "@/lib/gearImages"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/context/ToastContext"
import { usePageMeta } from "@/hooks/usePageMeta"
import GearCard from "@/components/gear/GearCard"
import RichContent from "@/components/common/RichContent"
import { FiTruck, FiShield } from "react-icons/fi"
import { BsStars } from "react-icons/bs"

/* ------------------------------------------------------------------ */
/* Image Gallery (inline)                                               */
/* ------------------------------------------------------------------ */

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0)

  // ── Touch / swipe state ──
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)
  const isSwiping = useRef(false)

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, images.length - 1)))
    },
    [images.length],
  )

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    isSwiping.current = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!isSwiping.current) return
    isSwiping.current = false
    const threshold = 50
    if (touchDeltaX.current < -threshold) {
      goTo(activeIndex + 1)
    } else if (touchDeltaX.current > threshold) {
      goTo(activeIndex - 1)
    }
  }, [activeIndex, goTo])

  const hasMultiple = images.length > 1
  const activeSrc = images[activeIndex] ?? ""

  return (
    <div className="space-y-3">
      {/* ── Main image ── */}
      <div
        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-sand via-white to-forest-50/30 shadow-sm"
        onTouchStart={hasMultiple ? onTouchStart : undefined}
        onTouchMove={hasMultiple ? onTouchMove : undefined}
        onTouchEnd={hasMultiple ? onTouchEnd : undefined}
      >
        <div className="relative flex aspect-[4/3] lg:aspect-[5/4] items-center justify-center p-4 sm:p-8">
          {activeSrc ? (
            <img
              key={activeSrc}
              src={activeSrc}
              alt={`${name} — photo ${activeIndex + 1}`}
              className="h-full w-full rounded-lg object-contain drop-shadow-lg transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl text-slate-300">
              ⛺
            </div>
          )}
        </div>

        {/* Mobile dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`View photo ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-200 ${
                  idx === activeIndex
                    ? "w-5 bg-forest-600"
                    : "w-2 bg-slate-400/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip (hidden when only 1 image) ── */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => goTo(idx)}
              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? "border-forest-600 shadow-md ring-2 ring-forest-600/20"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-slate-300"
              }`}
            >
              <img
                src={src}
                alt={`${name} thumbnail ${idx + 1}`}
                className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function GearDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<{ slug: string; gear: Gear | null } | null>(null)
  const [relatedGear, setRelatedGear] = useState<Gear[]>([])
  const [quantity, setQuantity] = useState(1)

  const loading = !state || state.slug !== slug
  const gear = state && state.slug === slug ? state.gear : null

  const { addItem } = useCart()
  const toast = useToast()

  usePageMeta({
    title: gear ? `${gear.name} — Yatriko Gears` : "Gear Details — Yatriko Gears",
    description:
      gear?.description ||
      "Rent high quality trekking and camping gear with delivery all over Nepal.",
    path: `/gear/${slug ?? ""}`,
  })

  useEffect(() => {
    if (!slug) return
    let active = true

    fetchGearBySlug(slug)
      .then((data) => {
        if (!active) return
        setState({ slug, gear: data ?? null })
        setQuantity(1)
      })
      .catch(() => {
        if (!active) return
        setState({ slug, gear: null })
      })

    return () => {
      active = false
    }
  }, [slug])

  // Load related gear recommendations
  useEffect(() => {
    if (!gear) return

    fetchGear().then((all) => {
      const filtered = all
        .filter((item) => item._id !== gear._id)
        .slice(0, 4)
      setRelatedGear(filtered)
    })
  }, [gear])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-100 border-t-forest-600" />
      </div>
    )
  }

  if (!gear) {
    return (
      <div className="section-pad bg-sand/30">
        <div className="container-site text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-forest-50 text-3xl">
            ⛺
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-navy-900 sm:text-3xl">
            Gear Not Found
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
            We could not find the gear you are looking for. It may have been renamed or removed from our catalogue.
          </p>
          <div className="mt-8">
            <Link to="/gear" className="btn-primary">
              ← Browse All Gear
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Build the gallery images array: prefer the multi-image `images` field,
  // fall back to the single `image` field for legacy/fallback data.
  const galleryImages: string[] = (() => {
    if (gear.images && gear.images.length > 0) {
      const resolved = gear.images.map((src) => resolveGearImage(src)).filter(Boolean)
      if (resolved.length > 0) return resolved
    }
    const single = resolveGearImage(gear.image)
    return single ? [single] : []
  })()

  const priceOnRequest = gear.realPrice === 0 && gear.discountedPrice === 0
  const categoryName =
    typeof gear.category === "object" && gear.category !== null
      ? gear.category.name
      : typeof gear.category === "string"
        ? gear.category
        : null

  const handleAddToCart = () => {
    addItem(gear._id, quantity)
    toast.success(`${quantity}x ${gear.name} added to your cart`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand/40 via-white to-sand/20">
      <div className="container-site py-6 sm:py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
          <Link to="/" className="transition-colors hover:text-forest-600">
            Home
          </Link>
          <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <Link to="/gear" className="transition-colors hover:text-forest-600">
            Gear
          </Link>
          {categoryName && (
            <>
              <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span className="text-slate-500">{categoryName}</span>
            </>
          )}
          <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="font-medium text-navy-900 truncate max-w-[180px] sm:max-w-none">
            {gear.name}
          </span>
        </nav>

        {/* ── Main Product Layout ── */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">

          {/* ─── Left: Product Image Gallery ─── */}
          <div className="space-y-5">
            {/* Gallery with overlay badges */}
            <div className="relative">
              <ImageGallery key={gear._id} images={galleryImages} name={gear.name} />

              {/* Overlay Badges — positioned over the gallery */}
              <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
                {gear.isNew && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-forest-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    New Arrival
                  </span>
                )}
              </div>

              <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col gap-1.5">
                {gear.availableFor.includes("rent") && (
                  <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-forest-700 shadow-sm backdrop-blur-sm">
                    Rent It
                  </span>
                )}
                {gear.availableFor.includes("sale") && (
                  <span className="rounded-lg bg-navy-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                    Buy It
                  </span>
                )}
              </div>
            </div>

            {/* Trust Badges — below image on desktop */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              {[
                { icon: <BsStars className="h-5 w-5" />, title: "Sanitized & Inspected", sub: "Thoroughly cleaned before every rental" },
                { icon: <FiTruck className="h-5 w-5" />, title: "All over Nepal Delivery", sub: "Delivered right to your doorstep" },
                { icon: <FiShield className="h-5 w-5" />, title: "Damage Protection", sub: "Fair deposit & wear tolerance" },
              ].map((badge) => (
                <div key={badge.title} className="group/badge flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:border-forest-200 hover:shadow-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-forest-600 transition-transform duration-200 group-hover/badge:scale-110">
                    {badge.icon}
                  </span>
                  <h4 className="text-xs font-bold text-navy-900">{badge.title}</h4>
                  <p className="text-[11px] leading-snug text-slate-400">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right: Product Info ─── */}
          <div className="lg:sticky lg:top-24">
            {/* Category + Name */}
            <div>
              {categoryName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-200/60 bg-forest-50/80 px-3.5 py-1 text-xs font-semibold text-forest-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
                  {categoryName}
                </span>
              )}
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
                {gear.name}
              </h1>
            </div>

            {/* Price Card — no discount badge or strikethrough */}
            <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="flex items-end gap-3">
                {priceOnRequest ? (
                  <span className="font-display text-xl font-bold text-forest-700">
                    Price on Request
                  </span>
                ) : (
                  <>
                    <span className="font-display text-4xl font-extrabold tracking-tight text-forest-700">
                      Rs. {gear.discountedPrice.toLocaleString()}
                    </span>
                    <span className="mb-1.5 text-sm font-medium text-slate-400">
                      / day
                    </span>
                  </>
                )}
              </div>

              {typeof gear.quantityTotal === "number" && (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  {gear.quantityTotal > 0 ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-forest-700">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-forest-500" />
                      </span>
                      In Stock — {gear.quantityTotal} available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Currently booked out
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {gear.description && (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  About This Gear
                  <span className="h-px flex-1 bg-slate-200" />
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                  {gear.description}
                </p>
              </div>
            )}

            {/* Colors */}
            {gear.colors && gear.colors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Available Colors
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {gear.colors.map((color) => (
                    <span
                      key={color}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-forest-300 hover:bg-forest-50"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {gear.specs && Object.keys(gear.specs).length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Specifications
                </h3>
                <dl className="mt-3 overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                  {Object.entries(gear.specs).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex justify-between px-4 py-3 text-sm ${
                        idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                      } ${idx > 0 ? "border-t border-slate-100" : ""}`}
                    >
                      <dt className="capitalize text-slate-500">{key}</dt>
                      <dd className="font-semibold text-navy-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mt-8 rounded-2xl border border-forest-100 bg-gradient-to-r from-forest-50/50 to-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Quantity Selector */}
                <div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-white px-1.5 shadow-sm sm:w-36">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 12h14" /></svg>
                  </button>
                  <span className="font-display text-lg font-bold text-navy-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        typeof gear.quantityTotal === "number" && gear.quantityTotal > 0
                          ? Math.min(gear.quantityTotal, q + 1)
                          : q + 1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
                    aria-label="Increase quantity"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="group/cta relative flex h-12 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-forest-600 font-display text-sm font-bold text-white shadow-lg shadow-forest-600/25 transition-all duration-200 hover:bg-forest-700 hover:shadow-xl hover:shadow-forest-700/30 active:scale-[0.98]"
                >
                  <svg
                    className="h-5 w-5 transition-transform duration-200 group-hover/cta:-translate-y-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Add to Cart · Rs. {(gear.discountedPrice * quantity).toLocaleString()}
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-slate-400 sm:text-left">
                Need custom rental dates or delivery? Add gear to your cart and proceed to booking.
              </p>
            </div>

            {/* Mobile Trust Badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 lg:hidden">
              {[
                { icon: <BsStars className="h-5 w-5" />, title: "Sanitized" },
                { icon: <FiTruck className="h-5 w-5" />, title: "Delivery" },
                { icon: <FiShield className="h-5 w-5" />, title: "Protected" },
              ].map((badge) => (
                <div key={badge.title} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm">
                  <span className="text-forest-600">{badge.icon}</span>
                  <span className="text-[10px] font-bold text-slate-600">{badge.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Rich Description Section ── */}
        {gear.longDescription && (
          <RichContent 
            title={`Product Description of ${gear.name}`} 
            content={gear.longDescription} 
          />
        )}

        {/* ── Related Gear Section ── */}
        {relatedGear.length > 0 && (
          <div className="mt-20 border-t border-slate-200/60 pt-12">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-forest-600">
                  Recommendations
                </span>
                <h2 className="mt-1 font-display text-2xl font-bold text-navy-900 sm:text-3xl">
                  You Might Also Need
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Frequently rented together for camping & treks.
                </p>
              </div>
              <Link
                to="/gear"
                className="hidden font-display text-sm font-semibold text-forest-700 transition-colors hover:text-forest-800 sm:inline-flex sm:items-center sm:gap-1"
              >
                View catalogue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedGear.map((item) => (
                <GearCard key={item._id} gear={item} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link to="/gear" className="btn-secondary text-sm">
                View full catalogue →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
