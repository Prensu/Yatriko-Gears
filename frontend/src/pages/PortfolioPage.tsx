import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchVideos } from "@/api/gear"
import type { Video } from "@/types"
import SectionHeading from "@/components/common/SectionHeading"

/**
 * Video portfolio. Clips are shot on phones in reel/TikTok format (9:16),
 * so the grid is built around a portrait frame rather than 16:9.
 * Videos come from the backend (/api/v1/video) with Cloudinary URLs.
 */
const LOCAL_VIDEOS: Video[] = [
  // { _id: "1", title: "Camp at Hattiban", cloudinaryUrl: "https://res.cloudinary.com/<cloud>/video/upload/...mp4", category: "Camps" },
]

export default function PortfolioPage() {
  const [videos, setVideos] = useState<Video[]>(LOCAL_VIDEOS)
  const [category, setCategory] = useState("All")

  // Live <video> nodes, keyed by id, so playing one can pause the rest.
  const videoNodes = useRef(new Map<string, HTMLVideoElement>())

  useEffect(() => {
    fetchVideos()
      .then((v) => v.length && setVideos(v))
      .catch(() => undefined)
  }, [])

  const registerVideo = useCallback((id: string, node: HTMLVideoElement | null) => {
    if (node) videoNodes.current.set(id, node)
    else videoNodes.current.delete(id)
  }, [])

  /** Only ever one clip playing at a time. */
  const pauseOthers = useCallback((playingId: string) => {
    videoNodes.current.forEach((node, id) => {
      if (id !== playingId && !node.paused) node.pause()
    })
  }, [])

  // "All" is also the backend's default category, so dedupe it out of the list.
  const categories = useMemo(
    () => ["All", ...new Set(videos.map((v) => v.category).filter((c) => c && c !== "All"))],
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
            {/* One lonely "All" pill is just noise — only show real choices. */}
            {categories.length > 1 ? (
              <div className="mt-10 flex flex-wrap justify-center gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition ${
                      category === c
                        ? "bg-forest-600 text-white"
                        : "bg-sand text-navy-800 hover:bg-forest-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {visible.map((video) => (
                <figure
                  key={video._id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-lg"
                >
                  {/* Portrait frame: object-contain keeps the full frame visible
                      even if a clip was shot landscape, letterboxed on navy. */}
                  <div className="relative aspect-[9/16] bg-navy-950">
                    <video
                      ref={(node) => registerVideo(video._id, node)}
                      onPlay={() => pauseOthers(video._id)}
                      controls
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 h-full w-full object-contain"
                    >
                      <source src={video.cloudinaryUrl} type="video/mp4" />
                    </video>
                  </div>
                  <figcaption className="p-3 font-display text-sm font-semibold text-navy-900 sm:p-4 sm:text-base">
                    {video.title}
                  </figcaption>
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
