import React from 'react'
import QuickPageShell from '@/components/QuickPageShell'

export default function OrdersPage() {
  return (
    <QuickPageShell title="Your Orders">
      <div className="rounded-md border border-graphite/20 p-6">You have no recent orders.</div>
    </QuickPageShell>
  )
}
