import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { fetchVideosPage } from "@/api/gear"
import type { Video } from "@/types"
import SectionHeading from "@/components/common/SectionHeading"
import { usePageMeta } from "@/hooks/usePageMeta"
import Breadcrumbs from "@/components/ui/Breadcrumbs"
import Pagination from "@/components/ui/Pagination"
import { PortfolioGridSkeleton } from "@/components/ui/Skeleton"

const PAGE_SIZE = 8

export default function PortfolioPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get("page") || "1") || 1)
  const category = params.get("category") ?? "All"
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const videoNodes = useRef(new Map<string, HTMLVideoElement>())

  usePageMeta({
    title: page > 1 ? `Portfolio — Page ${page}` : "Portfolio — Camps & Treks",
    description: "Camps, treks and events we have geared up across Nepal, filmed in the field.",
    path: `/portfolio${page > 1 || category !== "All" ? `?${new URLSearchParams({ ...(page > 1 ? { page: String(page) } : {}), ...(category !== "All" ? { category } : {}) })}` : ""}`,
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchVideosPage({ page, limit: PAGE_SIZE, category }).then((result) => {
      if (!active) return
      setVideos(result.videos)
      setTotal(result.total)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, category])

  useEffect(() => {
    fetchVideosPage({ page: 1, limit: 100 }).then((result) => {
      const available = [...new Set(result.videos.map((video) => video.category).filter(Boolean))]
      setCategories(["All", ...available.filter((item) => item !== "All")])
    })
  }, [])

  const registerVideo = useCallback((id: string, node: HTMLVideoElement | null) => {
    if (node) videoNodes.current.set(id, node)
    else videoNodes.current.delete(id)
  }, [])
  const pauseOthers = useCallback((playingId: string) => {
    videoNodes.current.forEach((node, id) => {
      if (id !== playingId && !node.paused) node.pause()
    })
  }, [])
  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next)
  }
  const changePage = (nextPage: number) => {
    updateParams({ page: String(nextPage) })
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }
  const changeCategory = (nextCategory: string) => updateParams({ category: nextCategory, page: "" })

  return (
    <section className="section-pad">
      <div className="container-site">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Portfolio" }]} />
        <SectionHeading eyebrow="Adventures on film" title="Our Portfolio" subtitle="Camps, treks and events we've geared up — straight from the field." />

        {categories.length > 1 && <div className="mt-10 flex flex-wrap justify-center gap-2">{categories.map((item) => <button key={item} type="button" onClick={() => changeCategory(item)} className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition ${category === item ? "bg-forest-600 text-white" : "bg-sand text-navy-800 hover:bg-forest-50"}`}>{item}</button>)}</div>}

        <div ref={gridRef} className="mt-10 scroll-mt-24">
          {loading ? <PortfolioGridSkeleton pageSize={PAGE_SIZE} /> : <div aria-busy="false" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">{videos.map((video) => <figure key={video._id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-lg"><div className="relative aspect-[9/16] bg-navy-950"><video ref={(node) => registerVideo(video._id, node)} onPlay={() => pauseOthers(video._id)} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain"><source src={video.cloudinaryUrl} type="video/mp4" /></video></div><figcaption className="p-3 font-display text-sm font-semibold text-navy-900 sm:p-4 sm:text-base">{video.title}</figcaption></figure>)}</div>}
        </div>
        {!loading && videos.length === 0 && <p className="mt-16 text-center text-slate-500">🎬 Videos coming soon — follow us on socials for the latest adventures!</p>}
        {!loading && <Pagination current={page} total={total} pageSize={PAGE_SIZE} onChange={changePage} />}
      </div>
    </section>
  )
}
