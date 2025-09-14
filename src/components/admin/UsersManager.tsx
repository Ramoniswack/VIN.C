import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type UserRow = {
  id: number
  email: string | null
  createdAt: string
  isAdmin: boolean
}

export const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      // DEV-friendly dev-bypass header
      if (import.meta.env && import.meta.env.DEV && !token) {
  if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['X-ADMIN'] = '1'
        headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
      }
      const resp = await fetch('/api/admin/users', { headers })
      if (!resp.ok) throw new Error('Failed to fetch users')
      const data = await resp.json()
      const rawUsers = Array.isArray(data?.users) ? data.users : []
      setUsers(rawUsers.map((u: unknown) => {
        const obj = u as Record<string, unknown>
        const id = obj.id === undefined ? 0 : Number(obj.id)
        const email = typeof obj.email === 'string' ? obj.email : null
        const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : (typeof obj.created_at === 'string' ? obj.created_at : new Date().toISOString())
        const isAdmin = Boolean(obj.isAdmin ?? obj.is_admin ?? false)
        return { id, email, createdAt, isAdmin }
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const makeAdmin = async (id: number) => {
    try {
      const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
      const headers: Record<string,string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (import.meta.env && import.meta.env.DEV && !token) {
  if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['X-ADMIN'] = '1'
        headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
      }
      const resp = await fetch(`/api/admin/users/${id}/make-admin`, { method: 'POST', headers })
      if (!resp.ok) throw new Error('Failed to promote')
      await fetchUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Error')
    }
  }

  const revokeAdmin = async (id: number) => {
    try {
      const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
      const headers2: Record<string,string> = {}
      if (token) headers2['Authorization'] = `Bearer ${token}`
      if (import.meta.env && import.meta.env.DEV && !token) {
  if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers2['X-ADMIN'] = '1'
        headers2['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
      }
      const resp = await fetch(`/api/admin/users/${id}/revoke-admin`, { method: 'POST', headers: headers2 })
      if (!resp.ok) throw new Error('Failed to revoke')
      await fetchUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Users</h2>
        <div>
          <Button variant="outline" size="sm" onClick={fetchUsers}>Refresh</Button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id} className="hover:bg-mink/5">
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                <TableCell>{u.email ? <Badge>{u.isAdmin ? 'Yes' : 'No'}</Badge> : '—'}</TableCell>
                <TableCell>
                  {u.isAdmin ? (
                    <Button size="sm" variant="outline" onClick={() => revokeAdmin(u.id)}>Revoke</Button>
                  ) : (
                    <Button size="sm" onClick={() => makeAdmin(u.id)}>Make Admin</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
