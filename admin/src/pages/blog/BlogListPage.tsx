import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { deleteBlog, fetchBlogList } from "@/api/blog"
import { formatDate, truncate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import type { Blog } from "@/types"

export default function BlogListPage() {
  usePageMeta("Blog")

  const list = useListResource<Blog>(fetchBlogList, { limit: 10, initialFilters: { status: "all" } })
  const [selected, setSelected] = useState<string[]>([])

  const slugById = useMemo(() => {
    const map = new Map<string, string>()
    list.rows.forEach((post) => map.set(post._id, post.slug))
    return map
  }, [list.rows])

  const deletion = useDeleteConfirm({
    remove: deleteBlog,
    entity: "blog post",
    onDone: (deleted) => {
      setSelected([])
      list.reloadAfterDelete(deleted)
    },
  })

  const columns: Column<Blog>[] = [
    {
      key: "title",
      header: "Post",
      render: (post) => (
        <div className="flex items-center gap-3">
          {post.coverImage ? (
            <img src={post.coverImage} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500">✎</span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{post.title}</p>
            <p className="truncate text-xs text-ink-500">{post.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "excerpt",
      header: "Excerpt",
      className: "hidden lg:table-cell",
      render: (post) => <span className="text-ink-600">{truncate(post.excerpt, 80)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (post) => <StatusBadge value={post.status} />,
    },
    {
      key: "publishedAt",
      header: "Published",
      className: "hidden sm:table-cell",
      render: (post) => <span className="whitespace-nowrap text-ink-500">{formatDate(post.publishedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (post) => (
        <div className="flex justify-end gap-1">
          <Link to={`/blog/${encodeURIComponent(post.slug)}/edit`} className="btn-secondary btn-sm">
            Edit
          </Link>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([post.slug], post.title)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Articles and camping advice published on the public site."
        actions={
          <Link to="/blog/new" className="btn-primary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add post
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(post) => post._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={{ value: list.search, onChange: list.setSearch, placeholder: "Search blog posts…" }}
        filters={
          <select
            className="input w-auto min-w-[9rem]"
            value={list.filters.status ?? "all"}
            onChange={(event) => list.setFilter("status", event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Drafts</option>
          </select>
        }
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={(ids) => (
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() =>
              deletion.request(
                ids.map((id) => slugById.get(id)).filter((slug): slug is string => Boolean(slug)),
                `${ids.length} blog posts`,
              )
            }
          >
            Delete selected
          </button>
        )}
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No blog posts yet"
        emptyMessage="Publish helpful camping and trekking advice for your customers."
        emptyAction={<Link to="/blog/new" className="btn-primary btn-sm">Add post</Link>}
      />

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
