// app/settings/layout.tsx
"use client";

import { Layout } from "@/components/Layout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
