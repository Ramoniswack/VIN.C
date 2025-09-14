import React from 'react'
import RequireAdmin from '@/components/RequireAdmin'
import OrdersManager from '@/components/admin/OrdersManager'

export default function Orders() {
  return (
    <div className="min-h-screen container mx-auto px-4 pt-28 pb-16">
      <RequireAdmin>
        <OrdersManager />
      </RequireAdmin>
    </div>
  )
}
