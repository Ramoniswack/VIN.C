import React from 'react'
import QuickPageShell from '@/components/QuickPageShell'

export default function RecentlyViewedPage() {
  return (
    <QuickPageShell title="Recently Viewed">
      <div className="rounded-md border border-graphite/20 p-6">No recently viewed items.</div>
    </QuickPageShell>
  )
}
