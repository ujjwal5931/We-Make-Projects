'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function RatingStars({
  rating,
  size = 'sm',
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const starSize = size === 'sm' ? 14 : 18
  const activeRating = hovered ?? rating

  return (
    <div
      className={cn('flex items-center gap-0.5', interactive && 'cursor-pointer')}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={`Rating: ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? star === rating : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(null)}
          className={cn(
            'outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
            !interactive && 'cursor-default pointer-events-none'
          )}
        >
          <Star
            size={starSize}
            className={cn(
              'transition-colors duration-100',
              star <= activeRating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-muted text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default RatingStars
