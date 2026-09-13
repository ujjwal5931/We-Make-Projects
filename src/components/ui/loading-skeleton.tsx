import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ─── Product Card Skeleton ───────────────────────────────────────────────────

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Thumbnail */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Category badge */}
        <Skeleton className="h-5 w-24 rounded-full" />

        {/* Product name */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Short description */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-3.5 rounded-sm" />
            ))}
          </div>
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>
    </div>
  )
}

// ─── Table Row Skeleton ───────────────────────────────────────────────────────

interface TableRowSkeletonProps {
  columns?: number
  rows?: number
  className?: string
}

export function TableRowSkeleton({
  columns = 5,
  rows = 5,
  className,
}: TableRowSkeletonProps) {
  return (
    <>
      {[...Array(rows)].map((_, rowIdx) => (
        <tr key={rowIdx} className={cn('border-b border-border', className)}>
          {[...Array(columns)].map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <Skeleton
                className={cn(
                  'h-4',
                  colIdx === 0 ? 'w-8' : colIdx === columns - 1 ? 'w-16' : 'w-full'
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Order Card Skeleton ──────────────────────────────────────────────────────

export function OrderCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 flex flex-col gap-4',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}
