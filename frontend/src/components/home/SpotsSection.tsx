import { SPOTS } from "@/lib/fallbackData"
import SectionHeading from "@/components/common/SectionHeading"
import { resolveSpotImage } from "@/lib/spotImages"

/** "Season Highlights" style row of popular camping spots near Kathmandu. */
export default function SpotsSection() {
  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeading
          eyebrow="Season Highlights"
          title="Where Will You Camp?"
          subtitle="Crowd-favorite camping spots around the valley — all within a short ride of Kathmandu."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SPOTS.map((spot) => (
            <article key={spot.name} className="group relative h-64 overflow-hidden rounded-2xl">
              <img
                src={resolveSpotImage(spot.image)}
                alt={spot.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white">
                <h3 className="font-display text-lg font-bold">{spot.name}</h3>
                <p className="text-xs text-white/80">{spot.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
