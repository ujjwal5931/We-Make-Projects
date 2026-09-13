'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, UserPlus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const registerSchema = z
  .object({
    userId: z
      .string()
      .min(3, 'User ID must be at least 3 characters')
      .max(30, 'User ID must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'User ID can only contain letters, numbers, and underscores'
      ),
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userId: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed. Please try again.')
        return
      }

      toast.success('Account created! Please sign in.')
      router.push('/login?registered=1')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fieldError = (field: keyof RegisterFormValues) =>
    errors[field]
      ? 'border-red-500 focus-visible:ring-red-500'
      : ''

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
              Create your account
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Join We Make Projects and get access to premium digital resources
            </p>
          </div>

          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                New Account
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Fill in the details below to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* User ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="userId" className="text-sm font-medium">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="john_doe123"
                    autoComplete="username"
                    autoFocus
                    disabled={isLoading}
                    {...register('userId')}
                    className={fieldError('userId')}
                  />
                  {errors.userId ? (
                    <p className="text-xs text-red-500">{errors.userId.message}</p>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      Letters, numbers, underscores only. Min 3 chars.
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    disabled={isLoading}
                    {...register('name')}
                    className={fieldError('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...register('email')}
                    className={fieldError('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number{' '}
                    <span className="text-neutral-400 font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    disabled={isLoading}
                    {...register('phone')}
                    className={fieldError('phone')}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register('password')}
                    className={fieldError('password')}
                  />
                  {errors.password ? (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  ) : (
                    <p className="text-xs text-neutral-500">Minimum 8 characters</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register('confirmPassword')}
                    className={fieldError('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-neutral-500 leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-neutral-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-neutral-700">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-orange-500 hover:text-orange-600 underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} We Make Projects. All rights reserved.
      </footer>
    </div>
  )
}
