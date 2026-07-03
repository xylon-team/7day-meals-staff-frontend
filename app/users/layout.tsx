'use client'

import { Layout } from '@/app/components/Layout'

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}
