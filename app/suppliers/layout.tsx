'use client'

import { Layout } from '@/components/Layout'
import { RequirePermission } from '@/components/RequirePermission'

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Layout>
      <RequirePermission permission="supplier_view">{children}</RequirePermission>
    </Layout>
  )
}
