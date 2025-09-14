import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QuickPageShell from '@/components/QuickPageShell'
import { IconButton } from '@/components/ui/button'
import { Home, LogOut, Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()

  return (
    <QuickPageShell title="Settings">
      <div className="flex items-center justify-between mb-6">
        <div />
        <div />
      </div>

      <ul className="space-y-3">
        <li><Link to="/policies" className="text-graphite hover:underline">Policies</Link></li>
        <li><Link to="/help" className="text-graphite hover:underline">Help</Link></li>
        <li><Link to="/feedback" className="text-graphite hover:underline">Feedback</Link></li>
      </ul>
    </QuickPageShell>
  )
}
