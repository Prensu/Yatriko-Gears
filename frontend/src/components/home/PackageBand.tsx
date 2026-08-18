import { Link } from "react-router-dom"

const PACKAGE_ITEMS = [
  "2-Person Tent",
  "Gas Stove",
  "2 Butane Gas",
  "Sleeping Bag",
  "Tent Light",
  "Foldable Chair",
]

/** Harvest Hosts-style value-anchored package card band. */
export default function PackageBand() {
  return (
    <section className="section-pad bg-forest-700 text-white">
      <div className="container-site grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="font-script text-3xl text-forest-200">Camp More, Worry Less</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
            The Complete Camp Package
          </h2>
          <p className="mt-4 text-forest-100">
            One booking, everything sorted. Our most-loved combo covers a full overnight camp for
            two — grab it and go.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {PACKAGE_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-forest-300">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-8 text-center text-navy-900 shadow-xl">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-forest-600">
            All-in-one combo
          </p>
          <p className="mt-4 font-display text-5xl font-extrabold">Rs. 4,300</p>
          <p className="mt-2 text-sm text-slate-500">per trip · worth Rs. 5,000+ individually</p>
          <Link to="/contact" className="btn-primary mt-6 w-full">Book This Package</Link>
          <p className="mt-3 text-xs text-slate-400">15% off during Grand Opening 🎉</p>
        </div>
      </div>
    </section>
  )
}
