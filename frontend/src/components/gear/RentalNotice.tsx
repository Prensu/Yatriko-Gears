import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  FileText,
  PackageCheck,
  Tent,
} from "lucide-react";

// Edit these to match your real rental flow.
const STEPS = [
  {
    icon: PackageCheck,
    title: "Pickup",
    text: "Check every item with our team before you head out.",
  },
  {
    icon: Tent,
    title: "Camp",
    text: "Keep gear clean and dry, and enjoy the outdoors.",
  },
  {
    icon: CalendarCheck,
    title: "Return",
    text: "Bring it back on the agreed date so the next camper is covered.",
  },
];

export default function RentalNotice() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="relative mt-14 flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70 lg:flex-row"
    >
      {/* ── Left: "ticket stub" ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-forest-700 to-navy-900 px-8 pb-40 pt-10 text-white lg:w-[340px] lg:shrink-0 lg:pb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ring-1 ring-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-forest-300" />
          Trail notes
        </span>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
          Before you
          <br />
          rent
        </h2>
        <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/70">
          Three quick stops to keep your adventure smooth.
        </p>

        {/* mountain silhouette */}
        <svg
          aria-hidden="true"
          viewBox="0 0 340 130"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full"
        >
          <path
            d="M0 130V88l52-44 38 30 56-58 62 70 40-34 52 48v50z"
            fill="rgba(255,255,255,0.08)"
          />
          <path
            d="M0 130V108l44-26 40 22 58-40 54 46 46-30 58 40v10z"
            fill="rgba(255,255,255,0.12)"
          />
        </svg>
      </div>

      {/* perforated seam (desktop) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 top-0 hidden lg:left-[340px] lg:block"
      >
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-sand" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-sand" />
        <div className="h-full border-l-2 border-dashed border-slate-200" />
      </div>

      {/* ── Right: steps + CTA ── */}
      <div className="flex flex-1 flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10">
        <ol className="relative grid gap-6 md:grid-cols-3">
          {/* dotted trail connecting the steps */}
          <div
            aria-hidden="true"
            className="absolute left-12 right-12 top-6 hidden border-t-2 border-dotted border-forest-200 md:block"
          />
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: reduce ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + index * 0.12, duration: 0.45 }}
              className="relative flex gap-4 md:block"
            >
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700 ring-4 ring-white">
                <Icon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-forest-600 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
              </span>
              <div className="md:mt-4">
                <h3 className="font-display text-base font-bold text-navy-900">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {text}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Want every detail on deposits, delays and damage?
          </p>
          <Link
            to="/rental-terms"
            className="group inline-flex w-fit items-center gap-3 rounded-full bg-forest-600 py-2 pl-2 pr-5 font-display text-sm font-bold text-white shadow-lg shadow-forest-900/20 transition hover:bg-forest-700 active:scale-[0.97]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-6">
              <FileText className="h-4 w-4" />
            </span>
            Read full terms &amp; conditions
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
