import { useEffect, useMemo, useState } from "react"
import { fetchGear } from "@/api/gear"
import type { Gear } from "@/types"
import GearCard from "@/components/gear/GearCard"
import SectionHeading from "@/components/common/SectionHeading"
import { usePageMeta } from "@/hooks/usePageMeta"

type Filter = "all" | "rent" | "sale" | "new"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All Gear" },
  { key: "rent", label: "For Rent" },
  { key: "sale", label: "For Sale" },
  { key: "new", label: "New Arrivals" },
]

export default function GearPage() {
  usePageMeta({
    title: "All Camping Gear on Rent",
    description: "Browse our full camping gear catalogue — tents, sleeping bags, stoves, chairs and lighting — with daily rental rates and valley-wide delivery.",
    path: "/gear",
  })

  const [gear, setGear] = useState<Gear[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetchGear().then(setGear)
  }, [])

  const visible = useMemo(() => {
    return gear.filter((g) => {
      if (filter === "rent" && !g.availableFor.includes("rent")) return false
      if (filter === "sale" && !g.availableFor.includes("sale")) return false
      if (filter === "new" && !g.isNew) return false
      if (query && !g.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [gear, filter, query])

  return (
    <section className="section-pad bg-sand">
      <div className="container-site">
        <SectionHeading
          eyebrow="Gear Up for Memories"
          title="All Camping Gear"
          subtitle="Every price shown is the discounted daily rate. DM or call to book."
        />

        {/* Category pills + search */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition ${
                  filter === f.key
                    ? "bg-forest-600 text-white"
                    : "bg-white text-navy-800 hover:bg-forest-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gear…"
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-forest-500 sm:w-64"
            aria-label="Search gear"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((g) => (
            <GearCard key={g._id} gear={g} />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="mt-16 text-center text-slate-500">No gear matches your search. 🏕️</p>
        )}
      </div>
    </section>
  )
}
