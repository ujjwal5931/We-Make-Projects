'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, ShieldCheck, ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const adminLoginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)
  const [accessDenied, setAccessDenied] = useState(
    errorParam === 'AccessDenied'
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { userId: '', password: '' },
  })

  const onSubmit = async (values: AdminLoginFormValues) => {
    setIsLoading(true)
    setAccessDenied(false)
    try {
      const result = await signIn('credentials', {
        userId: values.userId,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials. Please check your User ID and password.')
        return
      }

      toast.success('Welcome, Admin!')
      window.location.href = '/admin'
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      {/* Header */}
      <header className="w-full border-b border-neutral-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-orange-500 rounded-lg p-1.5">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">
              We Make Projects
            </p>
            <p className="text-neutral-500 text-xs leading-tight">
              Admin Portal
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to store
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Icon + Title */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4">
                <Lock className="h-7 w-7 text-orange-500" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
              <p className="text-sm text-neutral-500">
                Restricted to authorized administrators only
              </p>
            </div>
          </div>

          {/* Access Denied Alert */}
          {accessDenied && (
            <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Access Denied</p>
                <p className="text-xs text-red-500 mt-0.5">
                  This portal is for admin accounts only. Please use the{' '}
                  <Link href="/login" className="underline hover:text-red-300">
                    customer login
                  </Link>{' '}
                  instead.
                </p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="adminUserId"
                  className="text-sm font-medium text-neutral-300"
                >
                  Admin User ID
                </Label>
                <Input
                  id="adminUserId"
                  type="text"
                  placeholder="admin_id"
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  {...register('userId')}
                  className={[
                    'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600',
                    'focus-visible:ring-orange-500/50 focus-visible:border-orange-500',
                    errors.userId ? 'border-red-500' : '',
                  ].join(' ')}
                />
                {errors.userId && (
                  <p className="text-xs text-red-500">{errors.userId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="adminPassword"
                  className="text-sm font-medium text-neutral-300"
                >
                  Password
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                  className={[
                    'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600',
                    'focus-visible:ring-orange-500/50 focus-visible:border-orange-500',
                    errors.password ? 'border-red-500' : '',
                  ].join(' ')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Sign In as Admin
                  </>
                )}
              </Button>
            </form>

            <div className="border-t border-neutral-800 pt-4">
              <p className="text-xs text-center text-neutral-600">
                Not an admin?{' '}
                <Link
                  href="/login"
                  className="text-orange-500 hover:text-orange-400 underline underline-offset-4 transition-colors"
                >
                  Customer login →
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-700">
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-neutral-700 border-t border-neutral-900">
        &copy; {new Date().getFullYear()} We Make Projects — Admin Portal
      </footer>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
