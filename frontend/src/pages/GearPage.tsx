import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
        {isRentalPage && (
          <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-forest-100 bg-white shadow-[0_14px_45px_rgba(31,78,55,0.08)]">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-forest-50" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-forest-600">
                  <span className="h-2 w-2 rounded-full bg-forest-500" aria-hidden="true" />
                  Plan with confidence
                </div>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-navy-900">Before you rent</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  A few essentials to keep your adventure smooth from pickup to return.
                </p>
              </div>

              <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-5">
                <li className="flex items-start gap-3 rounded-2xl bg-sand/70 p-3 text-sm text-navy-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm" aria-hidden="true">🪪</span>
                  <span className="pt-1 font-semibold">Original Nepali ID</span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl bg-sand/70 p-3 text-sm text-navy-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm" aria-hidden="true">💰</span>
                  <span className="pt-1 font-semibold">Rs. 1,500 refundable deposit</span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl bg-sand/70 p-3 text-sm text-navy-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm" aria-hidden="true">✓</span>
                  <span className="pt-1 font-semibold">50% advance, full payment before delivery</span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl bg-sand/70 p-3 text-sm text-navy-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm" aria-hidden="true">⏱</span>
                  <span className="pt-1 font-semibold">Rs. 100/day late fee</span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl bg-sand/70 p-3 text-sm text-navy-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm" aria-hidden="true">☀</span>
                  <span className="pt-1 font-semibold">Open 6 AM to 6 PM</span>
                </li>
              </ul>
            </div>
            <div className="relative flex flex-col gap-3 border-t border-slate-100 bg-forest-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="text-sm text-slate-600">Need the complete rental policy?</p>
              <Link to="/rental-terms" className="inline-flex items-center font-display text-sm font-bold text-forest-700 transition hover:text-forest-900 hover:underline">
                Read full terms and conditions <span className="ml-1" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
