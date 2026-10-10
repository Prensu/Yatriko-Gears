import { Link } from "react-router-dom"
import StructuredData from "@/components/common/StructuredData"

export type BreadcrumbItem = { label: string; to?: string }

const CANONICAL_DOMAIN = "https://www.yatrikogears.com.np"

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.to ? { item: new URL(item.to, CANONICAL_DOMAIN).toString() } : {}),
    })),
  }

  return (
    <>
      <StructuredData data={breadcrumbData} />
      <nav aria-label="Breadcrumb" className="mb-8 min-w-0 overflow-x-auto">
        <ol className="flex min-w-max flex-wrap items-center gap-1.5 text-sm text-slate-400 sm:min-w-0">
          {items.map((item, index) => {
            const isCurrent = index === items.length - 1
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
                {isCurrent || !item.to ? (
                  <span aria-current={isCurrent ? "page" : undefined} className={`max-w-[12rem] truncate sm:max-w-none ${isCurrent ? "font-medium text-navy-900" : ""}`}>
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.to} className="max-w-[12rem] truncate transition-colors hover:text-forest-600 sm:max-w-none">
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
