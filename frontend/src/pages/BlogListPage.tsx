import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { fetchBlogList } from "@/api/blog"
import type { Blog } from "@/types"
import { usePageMeta } from "@/hooks/usePageMeta"
import Breadcrumbs from "@/components/ui/Breadcrumbs"
import Pagination from "@/components/ui/Pagination"

function formatPublishedDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function BlogListPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get("page") || "1") || 1)

  usePageMeta({
    title: page > 1 ? `Camping & Trekking Blog — Page ${page}` : "Camping & Trekking Blog",
    description: "Practical camping guides, trekking advice and outdoor ideas from Yatriko Gears in Nepal.",
    path: `/blog${window.location.search}`,
  })

  const [posts, setPosts] = useState<Blog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchBlogList(page)
      .then((result) => {
        if (!active) return
        setPosts(result.posts)
        setTotal(result.total)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError("We could not load the blog right now. Please try again soon.")
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page])

  return (
    <section className="section-pad bg-sand/40">
      <div className="container-site">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Blog" }]} />
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-600">From the trail</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-navy-900 sm:text-5xl">Camping & Trekking Blog</h1>
          <p className="mt-4 text-slate-600">Useful ideas for planning better camps, choosing the right gear and exploring Nepal with confidence.</p>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : error && posts.length === 0 ? (
          <p className="mt-16 text-center text-slate-500">{error}</p>
        ) : posts.length > 0 ? (
          <>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post._id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <Link to={`/blog/${encodeURIComponent(post.slug)}`} className="block">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="aspect-[16/9] w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-forest-50 text-5xl">⛺</div>
                    )}
                    <div className="p-5">
                      {post.publishedAt && <time dateTime={post.publishedAt} className="text-xs font-semibold uppercase tracking-wider text-forest-600">{formatPublishedDate(post.publishedAt)}</time>}
                      <h2 className="mt-2 font-display text-xl font-bold leading-snug text-navy-900">{post.title}</h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                      <span className="mt-5 inline-flex text-sm font-semibold text-forest-700">Read article →</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}
            <Pagination current={page} total={total} pageSize={9} onChange={(nextPage) => setParams(nextPage > 1 ? { page: String(nextPage) } : {})} />
          </>
        ) : (
          <p className="mt-16 text-center text-slate-500">New camping guides are coming soon.</p>
        )}
      </div>
    </section>
  )
}
