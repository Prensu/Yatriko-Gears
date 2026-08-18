import { useEffect, useMemo, useState } from "react"
import { fetchVideos } from "@/api/gear"
import type { Video } from "@/types"
import SectionHeading from "@/components/common/SectionHeading"

/**
 * Blazibyte-style video portfolio.
 * Videos come from the backend (/api/v1/video) with Cloudinary URLs.
 * Until then, paste Cloudinary URLs into LOCAL_VIDEOS below.
 */
const LOCAL_VIDEOS: Video[] = [
  // { _id: "1", title: "Camp at Hattiban", cloudinaryUrl: "https://res.cloudinary.com/<cloud>/video/upload/...mp4", category: "Camps" },
]

export default function PortfolioPage() {
  const [videos, setVideos] = useState<Video[]>(LOCAL_VIDEOS)
  const [category, setCategory] = useState("All")

  useEffect(() => {
    fetchVideos()
      .then((v) => v.length && setVideos(v))
      .catch(() => undefined)
  }, [])

  const categories = useMemo(
    () => ["All", ...new Set(videos.map((v) => v.category))],
    [videos],
  )
  const visible = category === "All" ? videos : videos.filter((v) => v.category === category)

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeading
          eyebrow="Adventures on film"
          title="Our Portfolio"
          subtitle="Camps, treks and events we've geared up — straight from the field."
        />

        {videos.length > 0 ? (
          <>
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition ${
                    category === c ? "bg-forest-600 text-white" : "bg-sand text-navy-800 hover:bg-forest-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((video) => (
                <figure key={video._id} className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                  <video controls preload="metadata" className="aspect-video w-full bg-navy-950 object-cover">
                    <source src={video.cloudinaryUrl} type="video/mp4" />
                  </video>
                  <figcaption className="p-4 font-display font-semibold text-navy-900">{video.title}</figcaption>
                </figure>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-16 text-center text-slate-500">
            🎬 Videos coming soon — follow us on socials for the latest adventures!
          </p>
        )}
      </div>
    </section>
  )
}
