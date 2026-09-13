import type { Metadata } from "next";
import Link from "next/link";
import { Code2, BookOpen, Cpu, Layers, Users, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = { title: "About Us — We Make Projects" };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">We Make Projects</h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
            A marketplace for engineering students to buy and download high-quality digital resources — CAD files, simulations, notes, and more.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Engineering students spend hours recreating academic deliverables from scratch. We Make Projects exists to change that — by providing a trusted platform where verified, ready-to-use engineering files are available at fair, accessible prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: BookOpen, title: "Save Time", desc: "Download verified engineering files and focus on understanding concepts, not recreating them." },
            { icon: Code2, title: "Quality Assured", desc: "Every product on our platform is reviewed for quality before being listed." },
            { icon: Users, title: "Student-First", desc: "Built by engineering students, for engineering students. Fair pricing, honest resources." },
          ].map(item => (
            <div key={item.title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-950/50 rounded-2xl mb-4">
                <item.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* What We Offer */}
        <div className="bg-muted/40 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">What We Sell</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Layers, title: "SolidWorks CAD Files", desc: ".SLDASM and .SLDPRT assemblies and parts for mechanical engineering projects." },
              { icon: Cpu, title: "ANSYS Simulation Files", desc: "Complete .wbpj simulation projects for structural, thermal, and fluid analysis." },
              { icon: BookOpen, title: "Engineering Notes", desc: "Handwritten or digital notes for core engineering subjects in PDF format." },
              { icon: Code2, title: "Software Files", desc: "Installation guides, scripts, and resources for engineering tools." },
            ].map(item => (
              <div key={item.title} className="flex gap-4 bg-card text-card-foreground rounded-xl p-4 border border-border">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Browse & Add to Cart", desc: "Find what you need, check details, and add to cart." },
              { step: "2", title: "Checkout & Pay via UPI", desc: "Provide billing info, scan the QR code, and pay the exact amount via any UPI app." },
              { step: "3", title: "Submit Payment Reference", desc: "Enter your UTR number and upload a screenshot of the transaction." },
              { step: "4", title: "Get Your Download Link", desc: "Our team verifies your payment (usually within 1–4 hours) and sends you the download link by email." },
            ].map(s => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
                <div>
                  <h4 className="font-semibold text-foreground">{s.title}</h4>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: ShieldCheck, label: "Secure Downloads" },
            { icon: Zap, label: "Fast Delivery" },
            { icon: Users, label: "500+ Students Served" },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-2 bg-card border border-border rounded-xl p-5">
              <b.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/products" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
