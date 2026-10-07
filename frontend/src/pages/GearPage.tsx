import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchGear } from "@/api/gear";
import type { Gear } from "@/types";
import GearCard from "@/components/gear/GearCard";
import SectionHeading from "@/components/common/SectionHeading";
import { usePageMeta } from "@/hooks/usePageMeta";

type Filter = "rent" | "sale" | "new";

const STORE_FILTERS: { key: Filter; label: string }[] = [
  { key: "sale", label: "For Sale" },
  { key: "new", label: "New Arrivals" },
];

const RENTAL_FILTERS: { key: Filter; label: string }[] = [
  { key: "rent", label: "Rental List" },
];

export default function GearPage({
  rentalOnly = false,
}: {
  rentalOnly?: boolean;
}) {
  const location = useLocation();
  const isRentalPage = rentalOnly || location.pathname === "/rental-list";

  usePageMeta({
    title: isRentalPage ? "Camping Gear Rental List" : "Camping Gear for Sale",
    description:
      "Browse our full camping gear catalogue — tents, sleeping bags, stoves, chairs and lighting — with nightly rental rates and valley-wide delivery.",
    path: isRentalPage ? "/rental-list" : "/gear",
  });

  const [gear, setGear] = useState<Gear[]>([]);
  const [filter, setFilter] = useState<Filter>(
    isRentalPage ? "rent" : "sale",
  );
  const [query, setQuery] = useState("");
  const activeFilter: Filter = isRentalPage ? "rent" : filter;

  useEffect(() => {
    fetchGear().then(setGear);
  }, []);

  const visible = useMemo(() => {
    return gear.filter((g) => {
      if (isRentalPage && !g.availableFor.includes("rent")) return false;
      if (activeFilter === "sale" && !g.availableFor.includes("sale")) return false;
      if (activeFilter === "new" && !g.isNew) return false;
      if (query && !g.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [gear, activeFilter, query, isRentalPage]);

  return (
    <section className="section-pad bg-sand">
      <div className="container-site">
        <SectionHeading
          eyebrow="Gear Up for Memories"
          title={isRentalPage ? "Rental List" : "Gear"}
          subtitle={
            isRentalPage
              ? "Browse all gear available for rent."
              : "Browse gear available for sale and our latest arrivals."
          }
        />

        {/* Category pills + search */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap justify-center gap-2">
            {(isRentalPage ? RENTAL_FILTERS : STORE_FILTERS).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition ${
                  activeFilter === f.key
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
            <GearCard
              key={g._id}
              gear={g}
              mode={isRentalPage ? "rent" : "sale"}
            />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="mt-16 text-center text-slate-500">
            No gear matches your search. 🏕️
          </p>
        )}
      </div>
    </section>
  );
}
