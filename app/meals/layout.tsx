'use client'

import { Layout } from '@/components/Layout'

export default function MealsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}
