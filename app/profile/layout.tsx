// app/profile/layout.tsx
"use client";

import { Layout } from "@/components/Layout";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
