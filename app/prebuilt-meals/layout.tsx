import { Layout } from '@/components/Layout'

export default function PrebuiltMealsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}
