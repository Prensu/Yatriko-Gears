import type { CSSProperties } from "react"

type SkeletonProps = { variant?: "text" | "rectangular" | "rounded" | "circular"; width?: string | number; height?: string | number; className?: string }

export function Skeleton({ variant = "text", width, height, className = "" }: SkeletonProps) {
  const style: CSSProperties = { width, height }
  const shape = variant === "text" ? "rounded" : variant === "circular" ? "rounded-full" : variant === "rounded" ? "rounded-2xl" : "rounded-none"
  return <span aria-hidden="true" style={style} className={`block animate-pulse bg-slate-200 motion-reduce:animate-none ${shape} ${className}`} />
}

export function GearCardSkeleton() {
  return <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><Skeleton variant="rectangular" className="aspect-[4/3] w-full" /><div className="p-4"><Skeleton width="5rem" height="0.75rem" /><Skeleton width="85%" height="1.25rem" className="mt-2" /><Skeleton width="65%" height="1.25rem" className="mt-1" /><Skeleton width="8rem" height="1.5rem" className="mt-3" /><Skeleton variant="rounded" width="100%" height="2.5rem" className="mt-4" /></div></article>
}

export function GearGridSkeleton({ pageSize = 12 }: { pageSize?: number }) {
  return <div aria-busy="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: pageSize }, (_, index) => <GearCardSkeleton key={index} />)}</div>
}

export function GearDetailSkeleton() {
  return <div aria-busy="true" className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12"><div><Skeleton variant="rounded" className="aspect-[4/3] w-full" /><div className="mt-3 flex gap-2"><Skeleton variant="rounded" width="5rem" height="5rem" /><Skeleton variant="rounded" width="5rem" height="5rem" /><Skeleton variant="rounded" width="5rem" height="5rem" /></div></div><div><Skeleton width="7rem" height="1.5rem" /><Skeleton width="85%" height="2.5rem" className="mt-4" /><Skeleton variant="rounded" height="7rem" className="mt-5 w-full" /><Skeleton width="100%" height="1rem" className="mt-6" /><Skeleton width="90%" height="1rem" className="mt-2" /><Skeleton width="75%" height="1rem" className="mt-2" /><Skeleton variant="rounded" height="5rem" className="mt-8 w-full" /></div></div>
}

export function PortfolioCardSkeleton() {
  return <figure className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><Skeleton variant="rectangular" className="aspect-[9/16] w-full bg-navy-900/10" /><div className="p-3 sm:p-4"><Skeleton width="78%" height="1.25rem" /></div></figure>
}

export function PortfolioGridSkeleton({ pageSize = 8 }: { pageSize?: number }) {
  return <div aria-busy="true" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">{Array.from({ length: pageSize }, (_, index) => <PortfolioCardSkeleton key={index} />)}</div>
}
