import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  // Protect admin routes (allow /admin/login through)
  if (
    nextUrl.pathname.startsWith('/admin') &&
    !nextUrl.pathname.startsWith('/admin/login')
  ) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', nextUrl))
    }
    if (!isAdmin) {
      // Logged in but not admin — redirect to admin login with error
      const url = new URL('/admin/login', nextUrl)
      url.searchParams.set('error', 'AccessDenied')
      return NextResponse.redirect(url)
    }
  }

  // Protect customer routes
  const protectedPaths = ['/account', '/checkout', '/payment']
  if (protectedPaths.some((path) => nextUrl.pathname.startsWith(path))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(nextUrl.pathname)}`, nextUrl)
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|images).*)',
  ],
}
