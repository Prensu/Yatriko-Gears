import { Link } from "react-router-dom";
import heroImage from "@/assets/lifestyle-breathe-freedom.jpg";

/** Hipcamp-style hero with big search-ish CTA band. */
export default function Hero() {
  return (
    <section className="relative">
      <div
        className="relative flex min-h-[78vh] items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="container-site relative py-20 text-white">
          <h1 className="font-script text-5xl sm:text-7xl text-forest-200 leading-tight">
            Escape. Explore. Experience.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Quality camping gear on rent & sale — delivery all over Nepal. Gear up. Head out. Make memories.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/gear" className="btn-primary">
              Browse Gear →
            </Link>
            <Link
              to="/contact"
              className="btn-secondary !border-white !text-white hover:!bg-white/10"
            >
              Plan My Trip
            </Link>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-b border-slate-100 bg-white">
        <div className="container-site grid grid-cols-2 gap-6 py-6 text-center sm:grid-cols-4">
          {[
            ["🚚", "Delivery all over Nepal"],
            ["💬", "DM to book instantly"],
            ["🛡️", "Quality guaranteed"],
            ["💰", "Best price guarantee"]
          ].map(([icon, label]) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-navy-800"
            >
              <span className="text-xl">{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
