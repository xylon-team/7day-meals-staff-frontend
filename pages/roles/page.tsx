'use client'

import React, { Suspense } from 'react'
import { Permissions } from '@/components/Permissions'

export default function RolesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-soft">Loading permissions...</div>}>
      <Permissions />
    </Suspense>
  )
}
