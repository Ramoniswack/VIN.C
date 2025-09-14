import React from 'react'
import Navigation from '@/components/Navigation'
import { Footer } from '@/components/Footer'

export default function Profile() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 pb-16 flex-1">
        <h1 className="text-3xl font-display">Manage Account</h1>
        <p className="mt-4 text-graphite">Update your account details here.</p>
      </main>
      <Footer />
    </div>
  )
}
