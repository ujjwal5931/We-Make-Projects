import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions — We Make Projects" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-foreground">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-8 text-xs text-amber-800 dark:text-amber-300">
        ⚠️ These are placeholder terms and conditions. They will be updated with legally reviewed content before the platform goes live.
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: September 2026</p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground">
        {[
          { title: "1. Acceptance of Terms", content: "By accessing and using the We Make Projects website and services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree, please do not use our services." },
          { title: "2. Products and Services", content: "We Make Projects sells digital engineering resources including CAD files, simulation projects, engineering notes, and software resources. All products are digital goods delivered electronically." },
          { title: "3. Payment", content: "We accept payments via UPI (Unified Payments Interface). Payments are manually verified by our team. We reserve the right to reject payments that cannot be verified or where the UTR/reference ID does not match our records." },
          { title: "4. Delivery", content: "Digital products are delivered via email after successful payment verification. Verification typically takes 1–4 hours on working days. Delivery times are not guaranteed and may vary based on workload." },
          { title: "5. Refund Policy", content: "Since all products are digital goods that are delivered immediately after payment approval, we do not offer refunds once a product has been delivered. If payment is rejected, no amount is deducted." },
          { title: "6. Intellectual Property", content: "All products sold on We Make Projects are the intellectual property of their respective creators. Purchasing a product grants you a personal, non-transferable license to use the file for your own academic purposes." },
          { title: "7. Prohibited Use", content: "You may not resell, redistribute, sublicense, or commercially exploit any products purchased from We Make Projects. Use is limited to personal academic purposes only." },
          { title: "8. Limitation of Liability", content: "We Make Projects is not liable for any academic outcomes, project results, or decisions made based on our products. Products are sold 'as-is' for reference purposes." },
          { title: "9. Contact", content: "For any queries regarding these terms, contact us at: support@wemakeprojects.com" },
        ].map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
            <p className="leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
