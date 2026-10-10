import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { fetchBlogBySlug } from "@/api/blog"
import type { Blog } from "@/types"
import { SITE_URL, usePageMeta } from "@/hooks/usePageMeta"
import StructuredData from "@/components/common/StructuredData"
import RichContent from "@/components/common/RichContent"
import Breadcrumbs from "@/components/ui/Breadcrumbs"
import { GearDetailSkeleton } from "@/components/ui/Skeleton"

function formatPublishedDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<{ slug: string; post: Blog | null } | null>(null)
  const post = state && state.slug === slug ? state.post : null
  const loading = !state || state.slug !== slug

  usePageMeta({
    title: post?.metaTitle || post?.title || "Camping & Trekking Blog",
    description: post?.metaDescription || post?.excerpt || "Camping guides and trekking advice from Yatriko Gears in Nepal.",
    path: `/blog/${slug ?? ""}`,
    image: post?.coverImage,
  })

  useEffect(() => {
    if (!slug) return
    let active = true
    fetchBlogBySlug(slug)
      .then((data) => {
        if (active) setState({ slug, post: data })
      })
      .catch(() => {
        if (active) setState({ slug, post: null })
      })
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return <div className="container-site py-6 sm:py-10" aria-busy="true"><Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Blog", to: "/blog" }, { label: "Loading…" }]} /><GearDetailSkeleton /></div>
  }

  if (!post) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-3xl font-bold text-navy-900">Article not found</h1>
        <p className="mt-3 text-slate-500">This blog post may have been unpublished or removed.</p>
        <Link to="/blog" className="btn-primary mt-8">Back to blog</Link>
      </div>
    )
  }

  const publishedDate = post.publishedAt || post.createdAt || ""
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: publishedDate || undefined,
    author: { "@type": "Person", name: post.author || "Yatriko Gears" },
    image: post.coverImage ? [new URL(post.coverImage, SITE_URL).toString()] : undefined,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  }

  return (
    <article className="section-pad bg-sand/30">
      <StructuredData data={articleData} />
      <div className="container-site max-w-4xl">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Blog", to: "/blog" }, { label: post.title }]} />
        <header className="mt-8 text-center">
          <h1 className="font-display text-4xl font-bold leading-tight text-navy-900 sm:text-5xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            {publishedDate && <time dateTime={publishedDate}>{formatPublishedDate(publishedDate)}</time>}
            <span aria-hidden="true">·</span>
            <span>By {post.author || "Yatriko Gears"}</span>
          </div>
        </header>

        {post.coverImage && <img src={post.coverImage} alt={post.title} className="mt-10 aspect-[16/8] w-full rounded-2xl object-cover shadow-sm" />}
        <RichContent content={post.content} />
      </div>
    </article>
  )
}
