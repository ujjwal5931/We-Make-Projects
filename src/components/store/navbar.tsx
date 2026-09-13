'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  ShoppingCart,
  Search,
  X,
  Menu,
  ChevronDown,
  Layers,
  User,
  Package,
  LogOut,
  LayoutDashboard,
  Home,
  Tag,
  ShoppingBag,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart-store'
import { cn } from '@/lib/utils'

// ─── Static category fallback ─────────────────────────────────────────────────

const FALLBACK_CATEGORIES = [
  { name: 'SolidWorks CAD Files', slug: 'solidworks-cad-files' },
  { name: 'ANSYS Simulation Files', slug: 'ansys-simulation-files' },
  { name: 'Engineering Notes', slug: 'engineering-notes' },
  { name: 'Software Installation Files', slug: 'software-installation-files' },
  { name: 'Other Digital Products', slug: 'other-digital-products' },
]

interface Category {
  name: string
  slug: string
}

const NAV_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Products', href: '/products', icon: ShoppingBag },
]

function getInitials(name?: string | null) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const itemCount = useCartStore((s) => s.itemCount())

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data: Category[]) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data)
      })
      .catch(() => {
        // silently fall back to hardcoded list
      })
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm shadow-sm transition-colors duration-150">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 select-none"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground text-base hidden sm:inline-block">
            We Make Projects
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Categories dropdown */}
          <DropdownMenu open={categoriesOpen} onOpenChange={setCategoriesOpen}>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none"
            >
              <Tag className="h-4 w-4" />
              Categories
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  categoriesOpen && 'rotate-180'
                )}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Browse Categories
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.slug}
                  onClick={() => router.push(`/categories/${cat.slug}`)}
                  className="cursor-pointer"
                >
                  {cat.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* ── Right section ── */}
        <div className="flex items-center gap-2">
          {/* Search — expandable */}
          <div className="flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <Input
                  ref={searchRef}
                  type="search"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-48 sm:w-64 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={mounted ? `Cart (${itemCount} items)` : "Cart"}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold leading-none">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* Auth — desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {status === 'loading' ? (
              <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-foreground text-background">
                      {getInitials(session.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                    {session.user?.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(session.user as any)?.userId}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/account')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/orders')} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile & Billing
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-7 items-center rounded-md px-2.5 text-[0.8rem] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-7 items-center rounded-md bg-foreground px-2.5 text-[0.8rem] font-medium text-background hover:bg-foreground/80 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col" showCloseButton={false}>

              {/* Sheet Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    We Make Projects
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <SheetClose className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </SheetClose>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {/* Nav links */}
                {NAV_LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={<Link href={link.href} />}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </SheetClose>
                ))}

                {/* Categories accordion */}
                <div>
                  <button
                    onClick={() => setCategoriesOpen((p) => !p)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Categories
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                        categoriesOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {categoriesOpen && (
                    <div className="ml-7 mt-1 space-y-0.5">
                      {categories.map((cat) => (
                        <SheetClose
                          key={cat.slug}
                          render={<Link href={`/categories/${cat.slug}`} />}
                          className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full text-left"
                        >
                          {cat.name}
                        </SheetClose>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                {/* Auth links in mobile */}
                {session ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-foreground text-background">
                          {getInitials(session.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(session.user as any)?.userId}
                        </p>
                      </div>
                    </div>
                    <SheetClose
                      render={<Link href="/account" />}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full"
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      Dashboard
                    </SheetClose>
                    <SheetClose
                      render={<Link href="/account/orders" />}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      My Orders
                    </SheetClose>
                    <SheetClose
                      render={<Link href="/account/profile" />}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile & Billing
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose
                        render={<Link href="/admin" />}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Admin Panel
                      </SheetClose>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-3 pt-1">
                    <SheetClose
                      render={<Link href="/login" />}
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Login
                    </SheetClose>
                    <SheetClose
                      render={<Link href="/register" />}
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background hover:bg-foreground/80 transition-colors"
                    >
                      Register
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
