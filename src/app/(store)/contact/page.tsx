import type { Metadata } from "next";
import { Mail, Phone, Clock } from "lucide-react";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Contact Us — We Make Projects" };

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const email = settings.contact_email || "support1@wemakeprojects.com";
  const phone = settings.support_phone || "+91 99999999991";
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  const contactItems = [
    {
      icon: Mail,
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      desc: "For order queries and product support",
    },
    {
      icon: Phone,
      label: "WhatsApp",
      value: phone,
      href: `https://wa.me/${cleanPhone}`,
      desc: "Quick support for urgent payment issues",
    },
    {
      icon: Clock,
      label: "Support Hours",
      value: "Mon–Sat, 9 AM–9 PM IST",
      href: null,
      desc: "We typically respond within 1–2 hours",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
        <p className="text-muted-foreground mt-2">We're here to help. Reach out via any of the channels below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {contactItems.map((item) => (
          <div key={item.label} className="bg-card text-card-foreground border border-border rounded-xl p-6 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl mb-4">
              <item.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{item.label}</h3>
            {item.href ? (
              <a href={item.href} className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
                {item.value}
              </a>
            ) : (
              <p className="text-muted-foreground font-medium text-sm">{item.value}</p>
            )}
            <p className="text-muted-foreground/80 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-8 max-w-lg mx-auto shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">Send a Message</h2>
        <form action={`mailto:${email}`} method="POST" encType="text/plain" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Your Name</label>
            <input name="name" required className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Arjun Mehta" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="arjun@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
            <input name="subject" required className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Payment verification for order WMP-2026-123456" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea name="message" required rows={4} className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe your issue or query in detail..." />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
            Send via Email Client
          </button>
          <p className="text-xs text-muted-foreground text-center">This will open your email client. For faster response, WhatsApp us directly.</p>
        </form>
      </div>
    </div>
  );
}
