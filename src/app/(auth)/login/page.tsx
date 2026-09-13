'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, LogIn, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userId: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
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

      toast.success('Welcome back!')
      window.location.href = from || '/'
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="w-full bg-neutral-900 border-b border-neutral-800 py-4 px-6">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="bg-orange-500 rounded-lg p-1.5">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            We Make Projects
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Sign in to your account
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Access your orders, downloads, and profile
            </p>
          </div>

          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                Customer Login
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Enter your User ID and password to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="userId" className="text-sm font-medium">
                    User ID
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="your_user_id"
                    autoComplete="username"
                    autoFocus
                    disabled={isLoading}
                    {...register('userId')}
                    className={errors.userId ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.userId && (
                    <p className="text-xs text-red-500">{errors.userId.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...register('password')}
                    className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-orange-500 hover:text-orange-600 underline underline-offset-4"
              >
                Create account
              </Link>
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-50 dark:bg-neutral-950 px-2 text-neutral-500">
                  or
                </span>
              </div>
            </div>
            <Link
              href="/admin/login"
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-4 transition-colors"
            >
              Sign in as Admin
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} We Make Projects. All rights reserved.
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
