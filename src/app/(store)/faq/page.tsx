import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "FAQ — We Make Projects" };

export default async function FAQPage() {
  const settings = await getStoreSettings();
  const email = settings.contact_email || "support1@wemakeprojects.com";
  const phone = settings.support_phone || "+91 99999999991";

  const faqs = [
    { q: "What types of products do you sell?", a: "We sell digital engineering resources including SolidWorks CAD files (.SLDASM/.SLDPRT), ANSYS simulation projects (.wbpj), engineering subject notes (PDF), software installation packages, and other digital resources for engineering students." },
    { q: "How do I purchase a product?", a: "Browse our catalog, add products to your cart, proceed to checkout, fill in your billing details, and place your order. You'll then be directed to the payment page." },
    { q: "How does the manual UPI payment work?", a: "After placing your order, you'll see a UPI QR code. Scan it with any UPI app (Google Pay, PhonePe, Paytm, etc.), pay the exact amount shown, take a screenshot, note the UTR/transaction reference ID, and submit these on the payment page. Our team manually verifies every payment." },
    { q: "How long does payment verification take?", a: "Payment verification typically takes 1–4 hours on working days (Monday–Saturday, 9 AM–9 PM IST). Urgent orders can contact us on WhatsApp." },
    { q: "When will I receive my download link?", a: "You'll receive the download link via email immediately after your payment is verified and approved. You can also download from My Orders page in your account." },
    { q: "Where is the download link sent?", a: "The download link is sent to your registered email address. Please check your spam folder if you don't see it in your inbox." },
    { q: "Can I download a product more than once?", a: "Yes, you can download the product multiple times using the link from My Orders page. Download links are tied to your account and remain accessible." },
    { q: "What if my payment is rejected?", a: "If rejected, you'll receive an email explaining the reason (e.g., wrong UTR, amount mismatch). You can resubmit correct payment details from the order page." },
    { q: "What if I entered the wrong UTR?", a: "Contact us immediately via WhatsApp or email with your order number and correct UTR. We'll update the payment reference and re-verify." },
    { q: "Are products refundable?", a: "Since all products are digital and delivered instantly after approval, we do not offer refunds. Please check the product description and requirements carefully before purchasing." },
    { q: "How do I contact support?", a: `Email: ${email} | WhatsApp: ${phone} | Support hours: Mon–Sat, 9 AM–9 PM IST.` },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-foreground">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mt-2">Everything you need to know about We Make Projects</p>
      </div>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details key={faq.q} className="group border border-border bg-card rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-foreground hover:bg-muted/50 rounded-xl gap-4">
              <span>{faq.q}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0" />
            </summary>
            <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
          </details>
        ))}
      </div>
      <div className="mt-12 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-foreground mb-2">Still have questions?</h3>
        <p className="text-sm text-muted-foreground mb-4">Our support team is available Mon–Sat, 9 AM–9 PM IST.</p>
        <a href={`mailto:${email}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">{email}</a>
      </div>
    </div>
  );
}
