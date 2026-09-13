import Link from "next/link";
import Image from "next/image";
import {
  Cog,
  Activity,
  BookOpen,
  Download,
  Package,
  ArrowRight,
  Star,
  CheckCircle,
  ShieldCheck,
  Zap,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProductCard from "@/components/store/product-card";

async function getFeaturedProducts() {
  try {
    const { prisma } = await import("@/lib/db");

    // First: get active + featured products
    const featured = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        category: true,
        _count: { select: { reviews: { where: { isVisible: true } } } },
        reviews: { where: { isVisible: true }, select: { rating: true } },
      },
    });

    // If we have fewer than 6 featured, top up with latest active products (not already included)
    let products = featured;
    if (featured.length < 6) {
      const featuredIds = featured.map((p) => p.id);
      const extras = await prisma.product.findMany({
        where: { isActive: true, id: { notIn: featuredIds } },
        orderBy: { createdAt: "desc" },
        take: 6 - featured.length,
        include: {
          category: true,
          _count: { select: { reviews: { where: { isVisible: true } } } },
          reviews: { where: { isVisible: true }, select: { rating: true } },
        },
      });
      products = [...featured, ...extras];
    }

    return products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        thumbnail: p.thumbnail,
        category: p.category,
        fileType: p.fileType,
        isFeatured: p.isFeatured,
        reviewCount: p._count.reviews,
        rating: Math.round(avgRating * 10) / 10,
      };
    });
  } catch (err) {
    console.error("getFeaturedProducts error:", err);
    return [];
  }
}


const categories = [
  { name: "SolidWorks CAD Files", slug: "solidworks-cad-files", icon: Cog, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-100 dark:border-blue-900/50", count: "50+" },
  { name: "ANSYS Simulation Files", slug: "ansys-simulation-files", icon: Activity, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-100 dark:border-purple-900/50", count: "30+" },
  { name: "Engineering Notes", slug: "engineering-notes", icon: BookOpen, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40", border: "border-green-100 dark:border-green-900/50", count: "100+" },
  { name: "Software Installation Files", slug: "software-installation-files", icon: Download, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-100 dark:border-orange-900/50", count: "25+" },
  { name: "Other Digital Products", slug: "other-digital-products", icon: Package, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", count: "20+" },
];

const howItWorks = [
  { step: "01", title: "Browse & Search", desc: "Explore our catalog of engineering project files, simulations, and notes. Use filters to find exactly what you need." },
  { step: "02", title: "Add to Cart & Checkout", desc: "Add your chosen products to cart, enter your billing details, and create your order in seconds." },
  { step: "03", title: "Complete UPI Payment", desc: "Scan the product-specific UPI QR code in any UPI app and pay the exact amount shown." },
  { step: "04", title: "Receive Download Link", desc: "After manual payment verification (1–4 hrs), get your secure download link via email." },
];

const whyUs = [
  { icon: CheckCircle, title: "Authentic Project Files", desc: "Every file is reviewed for quality and completeness before listing.", color: "text-green-600" },
  { icon: Zap, title: "Fast Delivery", desc: "Payment verification within 1–4 hours on working days. Faster for urgent orders.", color: "text-yellow-600" },
  { icon: ShieldCheck, title: "Secure Payments", desc: "UPI payments with manual verification. Your money is safe — we verify before delivering.", color: "text-blue-600" },
  { icon: Users, title: "Student Friendly Pricing", desc: "Affordable pricing designed for students. Big discounts on most products.", color: "text-purple-600" },
];

const demoReviews = [
  { name: "Arjun Mehta", course: "B.Tech Mechanical, 4th Year", rating: 5, text: "The SolidWorks gear assembly saved me so much time on my final year project. Everything was perfectly modelled and the drawings were included. Highly recommended!" },
  { name: "Priya Singh", course: "B.Tech Civil, 3rd Year", rating: 5, text: "Got the ANSYS bridge analysis project. Extremely detailed with all boundary conditions properly set. My professor was impressed with the results presentation." },
  { name: "Rohit Kumar", course: "B.Tech Computer Science, 2nd Year", rating: 4, text: "Fluid mechanics notes are excellent — comprehensive, well-organized, and exam-focused. Payment was verified within 2 hours and the download link worked perfectly." },
];

const faqs = [
  { q: "What types of products are sold?", a: "We sell digital engineering resources including SolidWorks CAD files (.SLDASM/.SLDPRT), ANSYS simulation projects (.wbpj), engineering subject notes (PDF), software installation packages, and other digital resources for engineering students." },
  { q: "How does the UPI payment process work?", a: "After placing your order, you'll see a UPI QR code. Scan it using any UPI app (Google Pay, PhonePe, Paytm, etc.), pay the exact amount, take a screenshot, enter your UTR number, and submit. Our team manually verifies the payment." },
  { q: "How long does payment verification take?", a: "Payment verification typically takes 1–4 hours on working days. You'll receive an email notification as soon as your payment is verified." },
  { q: "Where will I receive the download link?", a: "The download link is sent to your registered email address. You can also access it directly from the My Orders page in your account." },
  { q: "What if my payment is rejected?", a: "If your payment is rejected, you'll receive an email explaining the reason (e.g., incorrect UTR, amount mismatch). You can resubmit correct payment details from the order page." },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30">
              🎓 Built for Engineering Students
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Engineering Project Files,{" "}
              <span className="text-blue-400">Simulations & Notes</span>
              {" "}— All in One Place
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
              Download SolidWorks CAD files, ANSYS simulations, engineering notes, and software
              resources for your academic projects. Manual UPI payment — secure and trusted.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-base h-12 px-8 shadow-md hover:shadow-lg transition-all">
                <Link href="/products">Browse Products <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" className="bg-slate-800/90 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 text-base h-12 px-8 transition-all shadow-sm">
                <Link href="#categories">View Categories</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="bg-card text-card-foreground border-b border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "200+", label: "Products Available" },
              { value: "2,000+", label: "Students Served" },
              { value: "5", label: "Categories" },
              { value: "4.8★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────────── */}
      <section id="categories" className="py-20 bg-muted/40 scroll-mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">
              Explore Disciplines
            </span>
            <h2 className="text-3xl font-bold text-foreground mt-3">Browse by Category</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Find verified CAD models, simulation decks, structured notes, and software packages
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="group">
                <Card className="border border-border bg-card text-card-foreground group-hover:shadow-lg group-hover:-translate-y-1.5 transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-6 text-center flex flex-col items-center justify-between h-full">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${cat.bg} dark:bg-slate-800 mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <cat.icon className={`h-7 w-7 ${cat.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground leading-tight mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cat.name}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {cat.count} files
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {featuredProducts.some((p: any) => p.isFeatured)
                    ? "Featured Products"
                    : "Latest Products"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {featuredProducts.some((p: any) => p.isFeatured)
                    ? "Most popular engineering resources handpicked for you"
                    : "Newest engineering resources added to our store"}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/products">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-2">Simple 4-step process to get your engineering files</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-blue-100 dark:bg-blue-900/60 z-0" />
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-bold mb-4 shadow-lg">
                  {step.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Why Choose We Make Projects</h2>
            <p className="text-muted-foreground mt-2">We're built by engineering students, for engineering students</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item) => (
              <Card key={item.title} className="border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <item.icon className={`h-8 w-8 ${item.color} mb-4`} />
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer Reviews ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">What Students Say</h2>
            <p className="text-muted-foreground mt-2">Reviews from verified buyers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoReviews.map((review) => (
              <Card key={review.name} className="border border-border bg-card text-card-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {Array.from({ length: 5 - review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">"{review.text}"</p>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{review.name}</div>
                    <div className="text-xs text-muted-foreground">{review.course}</div>
                    <Badge variant="outline" className="mt-2 text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                      ✓ Verified Purchase
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border border-border bg-card rounded-lg overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-foreground hover:bg-muted/50 rounded-lg">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Project Files?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Browse our complete catalog of engineering resources
          </p>
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 text-base font-semibold">
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
