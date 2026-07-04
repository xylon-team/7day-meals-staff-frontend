'use client'

import { Layout } from '@/components/Layout'

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}
