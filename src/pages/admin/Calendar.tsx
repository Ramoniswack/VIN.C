import React, { useEffect, useState } from 'react'
import RequireAdmin from '@/components/RequireAdmin'
import { Calendar as DayCalendar } from '@/components/ui/calendar'

export default function AdminCalendar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen container mx-auto px-4 pt-28 pb-16">
      <RequireAdmin>
        <div>
          <h1 className="text-2xl font-medium mb-4">Admin Calendar</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="w-full">
              <div className="bg-transparent border border-graphite/20 rounded-md p-4">
                <DayCalendar />
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="bg-transparent border border-graphite/20 rounded-md p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Kathmandu (Nepal)</h2>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-semibold text-paper">{now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kathmandu' })}</p>
                  <p className="text-sm text-graphite mt-1">{now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kathmandu' })}</p>
                </div>
              </div>

              <div className="bg-transparent border border-graphite/20 rounded-md p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Sydney (Australia)</h2>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-semibold text-paper">{now.toLocaleTimeString('en-US', { timeZone: 'Australia/Sydney' })}</p>
                  <p className="text-sm text-graphite mt-1">{now.toLocaleDateString('en-GB', { timeZone: 'Australia/Sydney' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RequireAdmin>
    </div>
  )
}
