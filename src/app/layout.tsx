import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import SessionProvider from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: {
    default: "We Make Projects — Digital Engineering Resources",
    template: "%s | We Make Projects",
  },
  description:
    "Download SolidWorks CAD files, ANSYS simulations, engineering notes, and software resources for your academic projects.",
  keywords: [
    "engineering projects",
    "SolidWorks",
    "ANSYS",
    "CAD files",
    "engineering notes",
    "digital download",
    "college project",
  ],
  openGraph: {
    title: "We Make Projects",
    description: "Digital Engineering Resources for Students",
    type: "website",
    siteName: "We Make Projects",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased transition-colors duration-150">
        <SessionProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
