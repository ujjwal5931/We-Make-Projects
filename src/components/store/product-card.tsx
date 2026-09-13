'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Eye, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/store/rating-stars'
import { PriceDisplay } from '@/components/store/price-display'
import { useCartStore } from '@/store/cart-store'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  id?: string
  name?: string
  slug?: string
  thumbnail?: string | null
  price?: number
  discountPrice?: number | null
  category?: string
  rating?: number
  reviewCount?: number
  shortDescription?: string | null
  // Allow passing a product object directly
  product?: {
    id: string
    name: string
    slug: string
    thumbnail?: string | null
    price: number
    discountPrice?: number | null
    category?: { name?: string } | string | null
    _avg?: { rating?: number | null }
    _count?: { reviews?: number }
    shortDescription?: string | null
    [key: string]: any
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'SolidWorks CAD Files':
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'ANSYS Simulation Files':
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Engineering Notes':
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Software Installation Files':
    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'Other Digital Products':
    'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300',
}

function getCategoryColor(category?: string) {
  if (!category) return 'bg-muted text-muted-foreground'
  return CATEGORY_COLORS[category] ?? 'bg-muted text-muted-foreground'
}

export function ProductCard({
  product: productProp,
  id: idProp,
  name: nameProp,
  slug: slugProp,
  thumbnail: thumbProp,
  price: priceProp,
  discountPrice: discProp,
  category: catProp,
  rating: ratingProp,
  reviewCount: reviewCountProp,
  shortDescription: descProp,
}: ProductCardProps) {
  // Support both spread props and product={...} pattern
  const id = idProp ?? productProp?.id ?? ""
  const name = nameProp ?? productProp?.name ?? ""
  const slug = slugProp ?? productProp?.slug ?? ""
  const thumbnail = thumbProp ?? productProp?.thumbnail
  const price = priceProp ?? productProp?.price ?? 0
  const discountPrice = discProp !== undefined ? discProp : productProp?.discountPrice
  const catRaw = catProp ?? productProp?.category
  const category = typeof catRaw === "object" && catRaw !== null ? (catRaw as any).name : (catRaw as string | undefined)
  const rating = ratingProp ?? productProp?._avg?.rating ?? 0
  const reviewCount = reviewCountProp ?? productProp?._count?.reviews ?? 0
  const shortDescription = descProp ?? productProp?.shortDescription

  const { addItem, hasItem } = useCartStore()
  const inCart = hasItem(id)

  function handleAddToCart() {
    if (inCart) return
    const result = addItem({
      productId: id,
      name,
      price,
      discountPrice: discountPrice ?? null,
      thumbnail: thumbnail ?? null,
      slug,
    })
    if (result.added) {
      toast.success('Added to cart!', {
        description: name,
        action: {
          label: 'View Cart',
          onClick: () => { if (typeof window !== 'undefined') window.location.href = '/cart' },
        },
      })
    } else {
      toast.info(result.message)
    }
  }

  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Thumbnail */}
      <Link
        href={`/products/${slug}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
        tabIndex={-1}
        aria-hidden="true"
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {/* Placeholder envelope-ish SVG */}
            <svg
              className="h-16 w-16 text-muted-foreground/30"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 7l10 7L22 7" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-2.5 p-4">
        {/* Category badge */}
        {category && (
          <span
            className={cn(
              'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              getCategoryColor(category)
            )}
          >
            {category}
          </span>
        )}

        {/* Product name */}
        <Link
          href={`/products/${slug}`}
          className="text-sm font-semibold text-foreground line-clamp-2 hover:underline underline-offset-2 leading-snug"
        >
          {name}
        </Link>

        {/* Short description */}
        {shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <RatingStars rating={rating} size="sm" />
          <span className="text-xs text-muted-foreground">
            {rating > 0 ? rating.toFixed(1) : '—'}
            {reviewCount > 0 && ` (${reviewCount})`}
          </span>
        </div>

        {/* Price — pushed to bottom */}
        <div className="mt-auto pt-1">
          <PriceDisplay price={price} discountPrice={discountPrice} size="sm" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            variant={inCart ? 'secondary' : 'default'}
            className={cn(
              'flex-1 text-xs',
              inCart && 'text-green-700 dark:text-green-400'
            )}
            onClick={handleAddToCart}
            disabled={inCart}
          >
            {inCart ? (
              <>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                Add to Cart
              </>
            )}
          </Button>

          <Link
            href={`/products/${slug}`}
            className="inline-flex flex-1 h-7 items-center justify-center rounded-md border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
