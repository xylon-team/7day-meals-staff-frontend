'use client'

import {Users} from '@/pages/users/page'
import { AdminOnly } from '@/components/AdminOnly'

export default function UsersPage() {
  return (
    <AdminOnly>
      <Users />
    </AdminOnly>
  )
}
