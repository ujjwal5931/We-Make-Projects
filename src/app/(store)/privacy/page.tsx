import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — We Make Projects" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-foreground">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-8 text-xs text-amber-800 dark:text-amber-300">
        ⚠️ This is a placeholder privacy policy. It will be updated with legally reviewed content before the platform goes live.
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: September 2026</p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground">
        {[
          { title: "1. Information We Collect", content: "We collect information you provide when registering (user ID, name, email, phone), placing orders (billing address), and making payments (UTR reference, payment screenshot)." },
          { title: "2. How We Use Information", content: "We use collected information to process orders, verify payments, deliver digital products, send order notifications, and provide customer support." },
          { title: "3. Payment Information", content: "We do not store any UPI app credentials or banking passwords. We only store the UTR/transaction reference ID and a screenshot you submit. We never have access to your bank account." },
          { title: "4. Data Sharing", content: "We do not sell, trade, or share your personal information with third parties. Your data is only used to operate the We Make Projects service." },
          { title: "5. Data Security", content: "We implement security measures to protect your information. Passwords are hashed using bcrypt. Digital product files are stored outside the public directory and accessed only through authenticated download links." },
          { title: "6. Cookies", content: "We use session cookies for authentication purposes (next-auth). No third-party tracking cookies are used." },
          { title: "7. Your Rights", content: "You have the right to access, update, or delete your personal information. Contact us at support@wemakeprojects.com to exercise these rights." },
          { title: "8. Contact", content: "For privacy-related concerns: support@wemakeprojects.com" },
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
