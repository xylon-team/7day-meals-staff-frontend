'use client'

import { Suspense } from 'react'
import { Permissions } from '@/pages/roles/page'

export default function RolesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Permissions />
    </Suspense>
  )
}

