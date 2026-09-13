import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const registerSchema = z.object({
  userId: z
    .string()
    .min(3, 'User ID must be at least 3 characters')
    .max(30, 'User ID must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'User ID can only contain letters, numbers, and underscores'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { userId, name, email, phone, password } = parsed.data

    // Check userId uniqueness
    const existingByUserId = await prisma.user.findUnique({ where: { userId } })
    if (existingByUserId) {
      return NextResponse.json(
        { error: 'This User ID is already taken. Please choose another.' },
        { status: 409 }
      )
    }

    // Check email uniqueness
    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    await prisma.user.create({
      data: {
        userId,
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: 'CUSTOMER',
        isActive: true,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('[REGISTER_API]', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
