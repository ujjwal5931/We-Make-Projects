import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | We Make Projects',
    default: 'We Make Projects',
  },
  description: 'Sign in or create your We Make Projects account.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
