import Link from 'next/link'
import {
  Mail,
  MessageCircle,
  Layers,
  ExternalLink,
} from 'lucide-react'
import { getStoreSettings } from '@/lib/settings'

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'My Profile', href: '/account/profile' },
]

const SUPPORT_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
]

const CATEGORIES = [
  { label: 'SolidWorks CAD Files', href: '/categories/solidworks-cad-files' },
  { label: 'ANSYS Simulation Files', href: '/categories/ansys-simulation-files' },
  { label: 'Engineering Notes', href: '/categories/engineering-notes' },
  { label: 'Software Installation Files', href: '/categories/software-installation-files' },
]

export async function Footer() {
  const settings = await getStoreSettings()
  const email = settings.contact_email || 'support1@wemakeprojects.com'
  const phone = settings.support_phone || '+91 99999999991'
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white">We Make Projects</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Digital Engineering Resources for Students
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your one-stop destination for high-quality SolidWorks CAD files, ANSYS
              simulations, engineering notes, and software resources crafted for
              engineering students.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-2 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Categories
              </h4>
              {CATEGORIES.map((cat) => (
                <li key={cat.href} className="list-none">
                  <Link
                    href={cat.href}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-150 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {cat.label}
                  </Link>
                </li>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h3>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-3 group"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                    <Mail className="h-4 w-4 text-slate-400 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm text-slate-400 group-hover:text-white transition-colors">
                      {email}
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-green-900/60 transition-colors">
                    <MessageCircle className="h-4 w-4 text-slate-400 group-hover:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">WhatsApp</p>
                    <p className="text-sm text-slate-400 group-hover:text-white transition-colors">
                      {phone}
                    </p>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} We Make Projects. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
