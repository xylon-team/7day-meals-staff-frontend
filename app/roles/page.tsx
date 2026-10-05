'use client'

import { Suspense } from 'react'
import { Permissions } from '@/pages/roles/page'
import { AdminOnly } from '@/components/AdminOnly'

export default function RolesPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<div>Loading...</div>}>
        <Permissions />
      </Suspense>
    </AdminOnly>
  )
}

