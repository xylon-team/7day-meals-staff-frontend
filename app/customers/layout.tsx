'use client'

import { Layout } from '@/components/Layout'

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}
