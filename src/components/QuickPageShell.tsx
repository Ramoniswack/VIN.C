import React from 'react'
import Navigation from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { IconButton } from '@/components/ui/button'
import { ArrowLeft, Home, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function QuickPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <IconButton variant="ghost" size="icon" ariaLabel="Back to dashboard" onClick={() => { navigate('/dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              <ArrowLeft className="w-5 h-5" />
            </IconButton>
            <h1 className="text-3xl font-display">{title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <IconButton variant="ghost" size="icon" ariaLabel="Home" onClick={() => { navigate('/'); window.scrollTo({ top: 0 }) }}>
              <Home className="w-5 h-5" />
            </IconButton>
            <IconButton variant="ghost" size="icon" ariaLabel="Settings" onClick={() => navigate('/settings')}>
              <Settings className="w-5 h-5" />
            </IconButton>
            <IconButton variant="ghost" size="icon" ariaLabel="Logout" onClick={() => { localStorage.removeItem('supabase_access_token'); sessionStorage.removeItem('supabase_access_token'); navigate('/auth') }}>
              <LogOut className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {children}
      </main>

      <div className="mt-8 bg-surface border-t border-graphite/10">
        <div className="container mx-auto px-4 py-6">
          <Footer />
        </div>
      </div>
    </div>
  )
}
