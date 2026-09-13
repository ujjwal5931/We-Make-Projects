import { Navbar } from "@/components/store/navbar";
import { Footer } from "@/components/store/footer";
import { Toaster } from "@/components/ui/sonner";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
