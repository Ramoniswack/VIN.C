import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const location = useLocation()
  const [checking, setChecking] = useState(false)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      if (!isAuthenticated || !user) return
      // If already an admin locally, allow immediately
      if (user.isAdmin) {
        if (mounted) setAllowed(true)
        return
      }
      // Otherwise, consult backend admin list (with auth token when available)
      try {
        setChecking(true)
        const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`
        const resp = await fetch('/api/admin/emails', { headers })
        let serverEmails: string[] = []
        if (resp.ok) {
          try {
            const json = await resp.json()
            serverEmails = (json?.emails || []).map((s: string) => String(s).toLowerCase())
          } catch (e) {
            serverEmails = []
          }
        }
        // Always include env-configured admin emails as a fallback/override
        const envAdminList = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        const merged = Array.from(new Set([...envAdminList, ...serverEmails]))
        const username = (user.username || '').toLowerCase()
        if (merged.includes(username)) {
          // mark local store as admin so subsequent checks are fast
          useAuthStore.setState({ user: { username: user.username, isAdmin: true }, isAuthenticated: true })
          if (mounted) setAllowed(true)
        } else {
          if (mounted) setAllowed(false)
        }
      } catch (e) {
        if (mounted) setAllowed(false)
      } finally {
        if (mounted) setChecking(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [isAuthenticated, user])

  if (!isAuthenticated || !user) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  if (checking) {
    // Simple inline loading placeholder while we verify admin status
    return <div className="min-h-screen flex items-center justify-center">Checking permissions…</div>
  }

  if (allowed === false) {
    return <Navigate to="/" replace />
  }

  // allowed === true or user.isAdmin was already true
  return children
}
