import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  discountPrice?: number | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: {
    discounted: 'text-base font-bold',
    original: 'text-xs',
    regular: 'text-base font-semibold',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  md: {
    discounted: 'text-xl font-bold',
    original: 'text-sm',
    regular: 'text-xl font-semibold',
    badge: 'text-xs px-2 py-0.5',
  },
  lg: {
    discounted: 'text-3xl font-bold',
    original: 'text-base',
    regular: 'text-3xl font-semibold',
    badge: 'text-sm px-2.5 py-1',
  },
}

export function PriceDisplay({ price, discountPrice, size = 'md' }: PriceDisplayProps) {
  const cfg = sizeConfig[size]
  const hasDiscount =
    discountPrice !== null && discountPrice !== undefined && discountPrice < price
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice!) / price) * 100)
    : 0

  if (hasDiscount) {
    return (
      <div className="flex items-center flex-wrap gap-2">
        <span className={cn('text-foreground', cfg.discounted)}>
          ₹{discountPrice!.toFixed(2)}
        </span>
        <span className={cn('text-muted-foreground line-through', cfg.original)}>
          ₹{price.toFixed(2)}
        </span>
        <span
          className={cn(
            'rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
            cfg.badge
          )}
        >
          {discountPercent}% off
        </span>
      </div>
    )
  }

  return (
    <span className={cn('text-foreground', cfg.regular)}>₹{price.toFixed(2)}</span>
  )
}

export default PriceDisplay
