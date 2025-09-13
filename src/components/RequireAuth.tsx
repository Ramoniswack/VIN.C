import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    // redirect to login with next param so we can continue after auth
    const next = encodeURIComponent(location.pathname + location.search + location.hash)
    return <Navigate to={`/auth?next=${next}`} replace />
  }
  return children
}
