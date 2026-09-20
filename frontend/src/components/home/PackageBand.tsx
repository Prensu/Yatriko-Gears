import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchPackages } from "@/api/gear"
import type { Package } from "@/types"

/** Harvest Hosts-style value-anchored package card band. */
export default function PackageBand() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetchPackages().then((data) => {
      if (active) {
        setPackages(data)
        setLoaded(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // If still loading or if packages are turned off / none exist in admin, hide the band
  if (!loaded || packages.length === 0) {
    return null
  }

  if (packages.length > 1) {
    return (
      <section className="section-pad bg-forest-700 text-white">
        <div className="container-site">
          <div className="text-center">
            <p className="font-script text-3xl text-forest-200">Camp More, Worry Less</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              Camping Packages
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-forest-100">
              One booking, everything sorted. Grab a full combo kit and go.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className="flex flex-col justify-between rounded-3xl bg-white p-8 text-navy-900 shadow-xl"
              >
                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-widest text-forest-600">
                    All-in-one combo
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-navy-900">
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="mt-2 text-sm text-slate-600">{pkg.description}</p>
                  )}
                  {pkg.items.length > 0 && (
                    <ul className="mt-6 space-y-2 text-sm">
                      {pkg.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-slate-700">
                          <span className="text-forest-600">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                  <p className="font-display text-4xl font-extrabold text-navy-900">
                    Rs. {pkg.price.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">per trip · complete kit</p>
                  <Link to="/contact" className="btn-primary mt-4 w-full">
                    Book This Package
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const pkg = packages[0]

  return (
    <section className="section-pad bg-forest-700 text-white">
      <div className="container-site grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="font-script text-3xl text-forest-200">Camp More, Worry Less</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
            {pkg.name}
          </h2>
          <p className="mt-4 text-forest-100">
            {pkg.description ||
              "One booking, everything sorted. Our most-loved combo covers a full overnight camp — grab it and go."}
          </p>
          {pkg.items.length > 0 && (
            <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {pkg.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-forest-300">✓</span> {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl bg-white p-8 text-center text-navy-900 shadow-xl">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-forest-600">
            All-in-one combo
          </p>
          <p className="mt-4 font-display text-5xl font-extrabold">
            Rs. {pkg.price.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-sm text-slate-500">per trip · complete kit</p>
          <Link to="/contact" className="btn-primary mt-6 w-full">
            Book This Package
          </Link>
          <p className="mt-3 text-xs text-slate-400">15% off during Grand Opening 🎉</p>
        </div>
      </div>
    </section>
  )
}
