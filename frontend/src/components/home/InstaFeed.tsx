import SectionHeading from "@/components/common/SectionHeading"
import { CONTACTS } from "@/lib/fallbackData"

/**
 * Nepal Tourism-style Instagram feed grid.
 * Auto-discovers images in src/assets/insta/ (drop in your favorite posts).
 * Falls back to gear/lifestyle shots if the folder is empty.
 */
const instaImages = Object.values(
  import.meta.glob("../../assets/insta/*.{png,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
) as string[]

const fallbackImages = Object.values(
  import.meta.glob("../../assets/gear/*.{png,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
) as string[]

export default function InstaFeed() {
  const images = (instaImages.length ? instaImages : fallbackImages).slice(0, 8)
  return (
    <section className="section-pad bg-sand">
      <div className="container-site">
        <SectionHeading
          eyebrow="Nature is calling. Will you answer?"
          title="#YatrikoGears"
          subtitle="Follow the adventures — tag us to get featured."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <a
              key={i}
              href={CONTACTS.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              <img
                src={src}
                alt="Yatriko Gears on Instagram"
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-2xl opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                📷
              </div>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href={CONTACTS.instagram} target="_blank" rel="noreferrer" className="btn-secondary">
            Follow @yatriko_gears
          </a>
        </div>
      </div>
    </section>
  )
}
