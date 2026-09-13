import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

/**
 * Get current session server-side.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

/**
 * Get current session server-side.
 * Redirects to /admin/login if not authenticated or not an ADMIN.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/admin/login')
  }
  return session
}

/**
 * Fetches the full User record from the database using the current session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { billingAddress: true },
  })
}
