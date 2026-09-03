import type { Gear } from "@/types"
import { resolveGearImage } from "@/lib/gearImages"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/context/ToastContext"

export default function GearCard({ gear }: { gear: Gear }) {
  const imageSrc = resolveGearImage(gear.image)
  const hasDiscount = gear.discountedPrice > 0 && gear.discountedPrice < gear.realPrice
  const priceOnRequest = gear.realPrice === 0
  const { addItem } = useCart()
  const toast = useToast()

  const handleAdd = () => {
    addItem(gear._id)
    toast.success(`${gear.name} added to cart`)
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={gear.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">⛺</div>
        )}
        {gear.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-forest-600 px-3 py-1 text-xs font-bold text-white">NEW</span>
        )}
        <div className="absolute right-3 top-3 flex gap-1">
          {gear.availableFor.includes("rent") && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-forest-700">Rent It</span>
          )}
          {gear.availableFor.includes("sale") && (
            <span className="rounded-full bg-navy-900/90 px-2.5 py-1 text-[11px] font-bold text-white">Buy It</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-navy-900">{gear.name}</h3>
        {gear.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{gear.description}</p>}
        <div className="mt-3 flex items-baseline gap-2">
          {priceOnRequest ? (
            <span className="text-sm font-semibold text-forest-700">Price on request</span>
          ) : (
            <>
              <span className="font-display text-lg font-bold text-forest-700">Rs. {gear.discountedPrice}</span>
              {hasDiscount && <span className="text-sm text-slate-400 line-through">Rs. {gear.realPrice}</span>}
            </>
          )}
        </div>
        {gear.colors.length > 0 && (
          <p className="mt-2 text-[11px] text-slate-400">Colors: {gear.colors.join(" · ")}</p>
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-forest-600 px-4 py-2
                     font-display text-sm font-semibold text-white transition hover:bg-forest-700 active:scale-[0.97]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Add to Cart
        </button>
      </div>
    </article>
  )
}
