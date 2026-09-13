"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ShoppingCart, Star, Check, Package, FileText, HardDrive, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/store/cart-store";
import RatingStars from "@/components/store/rating-stars";
import PriceDisplay from "@/components/store/price-display";
import ProductCard from "@/components/store/product-card";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();
  const { addItem, hasItem } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [reviewEligible, setReviewEligible] = useState<any>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setProduct(data.product);
        setRelated(data.related || []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (product && session?.user) {
      fetch(`/api/reviews?productId=${product.id}`)
        .then((r) => r.json())
        .then(setReviewEligible);
    }
  }, [product, session]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
      <p className="text-slate-500 mb-6">This product may have been removed or is unavailable.</p>
      <Button asChild><Link href="/products">Browse Products</Link></Button>
    </div>
  );

  const allImages = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...product.images.map((img: any) => img.imageUrl),
  ].filter(Boolean);

  const handleAddToCart = () => {
    if (!session?.user) {
      toast.error("Please login to add items to cart");
      return;
    }
    const result = addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      thumbnail: product.thumbnail,
      slug: product.slug,
    });
    if (result.added) toast.success("Added to cart!");
    else toast.info(result.message);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, ...reviewForm }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted!");
        if (typeof window !== 'undefined') window.location.reload();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-3 border border-border">
              {allImages.length > 0 ? (
                <Image
                  src={allImages[selectedImage] || "/images/placeholder-product.png"}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder-product.png"; }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-blue-600" : "border-border"}`}
                  >
                    <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Badge variant="secondary" className="mb-3">{product.category.name}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <RatingStars rating={product.rating} />
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="mb-6">
              <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="lg" />
            </div>

            {product.shortDescription && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* File Details */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {product.fileType && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs font-semibold text-foreground">{product.fileType}</div>
                  <div className="text-xs text-muted-foreground">File Type</div>
                </div>
              )}
              {product.fileSize && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <HardDrive className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs font-semibold text-foreground">{product.fileSize}</div>
                  <div className="text-xs text-muted-foreground">File Size</div>
                </div>
              )}
              {product.numberOfPages && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Package className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs font-semibold text-foreground">{product.numberOfPages}</div>
                  <div className="text-xs text-muted-foreground">Pages</div>
                </div>
              )}
            </div>

            {/* Cart Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {hasItem(product.id) ? (
                <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <Link href="/cart"><Check className="h-4 w-4 mr-2" /> In Cart — Go to Cart</Link>
                </Button>
              ) : (
                <Button onClick={handleAddToCart} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
              )}
              {product.previewUrl && (
                <Button variant="outline" asChild>
                  <a href={product.previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Preview
                  </a>
                </Button>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
              <strong>🔒 Secure Delivery:</strong> After purchase, your file will be delivered via email once payment is manually verified (1–4 hours).
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="mb-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="included">What's Included</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </TabsContent>

            <TabsContent value="features">
              <ul className="space-y-2">
                {(product.features || []).map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="requirements">
              <ul className="space-y-2">
                {(product.requirements || []).map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0 mt-2" />
                    <span className="text-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="included">
              <ul className="space-y-2">
                {(product.whatsIncluded || []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>

        {/* Reviews */}
        <div className="mt-12 border-t border-border pt-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Customer Reviews</h2>

          <div className="flex items-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-foreground">{product.rating.toFixed(1)}</div>
              <RatingStars rating={product.rating} />
              <div className="text-sm text-muted-foreground mt-1">{product.reviewCount} reviews</div>
            </div>
            <div className="flex-1 space-y-2">
              {(product.ratingDistribution || []).map((d: any) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-sm w-4 text-foreground">{d.star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: product.reviewCount > 0 ? `${(d.count / product.reviewCount) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-6">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Form */}
          {session?.user ? (
            reviewEligible?.eligible ? (
              <Card className="mb-8 border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    {reviewEligible.existingReview ? "Edit Your Review" : "Write a Review"}
                  </h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
                      <RatingStars
                        rating={reviewForm.rating}
                        interactive
                        onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Review Title</label>
                      <input
                        required
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Summarize your experience"
                        className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Review</label>
                      <textarea
                        required
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                        placeholder="Share your detailed experience with this product..."
                        className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button type="submit" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-muted border border-border rounded-lg p-4 mb-8 text-sm text-muted-foreground">
                Only verified buyers can review this product.{" "}
                {!reviewEligible?.eligible && reviewEligible?.reason === "not_purchased" && (
                  <Link href="/products" className="text-blue-600 dark:text-blue-400 hover:underline">Purchase this product</Link>
                )}
              </div>
            )
          ) : (
            <div className="bg-muted border border-border rounded-lg p-4 mb-8 text-sm text-muted-foreground">
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Log in</Link> to leave a review. Only verified buyers can review.
            </div>
          )}

          {/* Review List */}
          <div className="space-y-6">
            {(product.reviews || []).map((review: any) => (
              <div key={review.id} className="border-b border-border pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-foreground">{review.user.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingStars rating={review.rating} size="sm" />
                      <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                        ✓ Verified Purchase
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <h4 className="font-medium text-foreground mt-2">{review.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.comment}</p>
              </div>
            ))}
            {product.reviews?.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-12 border-t border-border pt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
