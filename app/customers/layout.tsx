'use client'

import { Layout } from '@/components/Layout'
import { AdminOnly } from '@/components/AdminOnly'

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Layout>
      <AdminOnly>{children}</AdminOnly>
    </Layout>
  )
}
