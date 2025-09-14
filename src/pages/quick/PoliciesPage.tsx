import React from 'react'
import Navigation from '@/components/Navigation'
import { Footer } from '@/components/Footer'

export default function PoliciesPage(){
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-display mb-4">Policies</h1>
        <div className="rounded-md border border-graphite/20 p-6">Company policies and terms.</div>
      </main>
      <Footer />
    </div>
  )
}
