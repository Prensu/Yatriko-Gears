import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText, Tent } from "lucide-react";
import { fetchCategories, fetchGearPage } from "@/api/gear";
import type { Gear, GearCategory } from "@/types";
import GearCard from "@/components/gear/GearCard";
import SectionHeading from "@/components/common/SectionHeading";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Pagination from "@/components/ui/Pagination";
import { GearGridSkeleton } from "@/components/ui/Skeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

type Filter = "sale" | "new";
const PAGE_SIZE = 16;
const STORE_FILTERS: { key: Filter; label: string }[] = [
  { key: "sale", label: "For Sale" },
  { key: "new", label: "New Arrivals" },
];

export default function GearPage({
  rentalOnly = false,
}: {
  rentalOnly?: boolean;
}) {
  const location = useLocation();
  const reduce = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const isRentalPage = rentalOnly || location.pathname === "/rental-list";
  const page = Math.max(1, Number(params.get("page") || "1") || 1);
  const query = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const filter = (params.get("filter") as Filter) || "sale";
  const [gear, setGear] = useState<Gear[]>([]);
  const [categories, setCategories] = useState<GearCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const activeFilter = isRentalPage ? "rent" : filter;
  const categoryName = categories.find((item) => item.slug === category)?.name;
  const title = isRentalPage
    ? "Camping Gear Rental List"
    : "Camping Gear for Sale";

  usePageMeta({
    title: page > 1 ? `${title} — Page ${page}` : title,
    description:
      "Browse our full camping gear catalogue — tents, sleeping bags, stoves, chairs and lighting — with nightly rental rates and valley-wide delivery.",
    path: `${isRentalPage ? "/rental-list" : "/gear"}${page > 1 || query || category || filter !== "sale" ? `?${new URLSearchParams({ ...(page > 1 ? { page: String(page) } : {}), ...(query ? { search: query } : {}), ...(category ? { category } : {}), ...(!isRentalPage && filter !== "sale" ? { filter } : {}) })}` : ""}`,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    // The API cannot filter by availableFor, so rental mode loads the
    // catalogue first and paginates the rental-only results below.
    fetchGearPage({
      page: isRentalPage ? 1 : page,
      limit: isRentalPage ? 100 : PAGE_SIZE,
      search: query,
      category,
    })
      .then((result) => {
        if (!active) return;
        setGear(result.gear);
        setTotal(result.total);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, query, category, isRentalPage]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setParams(next);
  };
  const resetPage = (updates: Record<string, string>) =>
    updateParams({ ...updates, page: "" });
  const filteredGear = gear.filter((item) => {
    if (activeFilter === "rent" && !item.availableFor.includes("rent"))
      return false;
    if (activeFilter === "sale" && !item.availableFor.includes("sale"))
      return false;
    if (activeFilter === "new" && !item.isNew) return false;
    return true;
  });
  const visible = isRentalPage
    ? filteredGear.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filteredGear;
  const paginationTotal = isRentalPage ? filteredGear.length : total;
  const changePage = (nextPage: number) => {
    updateParams({ page: String(nextPage) });
    requestAnimationFrame(() =>
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <section className="section-pad bg-sand">
      <div className="container-site">
        <Breadcrumbs
          items={
            categoryName
              ? [
                  { label: "Home", to: "/" },
                  {
                    label: isRentalPage ? "Rental List" : "Gear",
                    to: isRentalPage ? "/rental-list" : "/gear",
                  },
                  { label: categoryName },
                ]
              : [
                  { label: "Home", to: "/" },
                  { label: isRentalPage ? "Rental List" : "Gear" },
                ]
          }
        />
        <SectionHeading
          eyebrow="Gear Up for Memories"
          title={isRentalPage ? "Rental List" : "Gear"}
          subtitle={
            isRentalPage
              ? "Browse all gear available for rent."
              : "Browse gear available for sale and our latest arrivals."
          }
        />
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap justify-center gap-2">
            {(isRentalPage
              ? [{ key: "rent", label: "Rental List" }]
              : STORE_FILTERS
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => resetPage({ filter: item.key })}
                className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition ${activeFilter === item.key ? "bg-forest-600 text-white" : "bg-white text-navy-800 hover:bg-forest-50"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(event) => resetPage({ category: event.target.value })}
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-500 sm:w-44"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item._id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={query}
              onChange={(event) => resetPage({ search: event.target.value })}
              placeholder="Search gear…"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-forest-500 sm:w-64"
              aria-label="Search gear"
            />
          </div>
        </div>
        <div ref={gridRef} className="mt-10 scroll-mt-24">
          {loading ? (
            <GearGridSkeleton pageSize={PAGE_SIZE} />
          ) : (
            <div
              aria-busy="false"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {visible.map((item) => (
                <GearCard
                  key={item._id}
                  gear={item}
                  mode={isRentalPage ? "rent" : "sale"}
                />
              ))}
            </div>
          )}
        </div>
        {!loading && visible.length === 0 && (
          <p className="mt-16 text-center text-slate-500">
            No gear matches your search. 🏕️
          </p>
        )}
        {!loading && (
          <Pagination
            current={page}
            total={paginationTotal}
            pageSize={PAGE_SIZE}
            onChange={changePage}
          />
        )}

        {isRentalPage && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-700 via-forest-600 to-navy-900 shadow-[0_24px_60px_-20px_rgba(31,78,55,0.55)]"
          >
            {/* floating glows */}
            <motion.div
              aria-hidden="true"
              animate={reduce ? undefined : { y: [0, 18, 0], x: [0, -10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-forest-400/30 blur-3xl"
            />
            <motion.div
              aria-hidden="true"
              animate={reduce ? undefined : { y: [0, -16, 0], x: [0, 12, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            {/* subtle dotted texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
            />
            {/* big faint tent */}
            <Tent
              aria-hidden="true"
              strokeWidth={1}
              className="pointer-events-none absolute -bottom-10 right-6 hidden h-64 w-64 text-white/10 md:block"
            />

            <div className="relative flex flex-col gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white ring-1 ring-white/20 backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Plan with confidence
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Before you rent
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                  A few essentials to keep your adventure smooth from pickup to
                  return.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <p className="text-sm text-white/70">
                  Need the complete rental policy?
                </p>
                <motion.div
                  whileHover="hover"
                  whileTap={{ scale: 0.97 }}
                  className="w-fit"
                >
                  <Link
                    to="/rental-terms"
                    className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-3 pr-5 font-display text-sm font-bold text-navy-900 shadow-lg shadow-black/20 transition-colors hover:bg-forest-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-600 text-white transition-transform duration-300 group-hover:rotate-6">
                      <FileText className="h-4 w-4" />
                    </span>
                    Read full terms and conditions
                    <motion.span
                      variants={{ hover: { x: 4 } }}
                      className="inline-flex"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
