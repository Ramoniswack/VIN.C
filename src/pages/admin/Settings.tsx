import React, { useEffect, useState } from 'react'
import RequireAdmin from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminSettings() {
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')

  const buildHeaders = () => {
    const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (import.meta.env && import.meta.env.DEV) {
      headers['X-ADMIN-EDIT'] = '1'
    }
    return headers
  }

  const load = async () => {
    try {
      const resp = await fetch('/api/admin/emails', { headers: buildHeaders() })
      if (!resp.ok) return
      const json = await resp.json()
      setEmails((json.emails || []) as string[])
    } catch (e) { console.warn(e) }
  }

  useEffect(() => { (async () => { await load() })() }, [])

  const add = async () => {
    try {
      const resp = await fetch('/api/admin/emails', { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ email: newEmail }) })
      if (resp.ok) { setNewEmail(''); load() }
    } catch (e) { console.warn(e) }
  }

  const remove = async (email: string) => {
    try {
      const resp = await fetch('/api/admin/emails', { method: 'DELETE', headers: buildHeaders(), body: JSON.stringify({ email }) })
      if (resp.ok) load()
    } catch (e) { console.warn(e) }
  }

  return (
    <div className="min-h-screen container mx-auto px-4 pt-28 pb-16">
      <RequireAdmin>
        <div>
          <h1 className="text-2xl font-medium mb-4">Admin Settings</h1>
          <div className="mb-4">
            <label className="block text-sm mb-2">Add Admin Email</label>
            <div className="flex space-x-2">
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
              <Button onClick={add}>Add</Button>
            </div>
          </div>
          <div>
            <h2 className="font-medium mb-2">Admin Emails</h2>
            <ul className="space-y-2">
              {emails.map((e) => (
                <li key={e} className="flex justify-between items-center border p-2 rounded">
                  <span>{e}</span>
                  <Button variant="destructive" size="sm" onClick={() => remove(e)}>Remove</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RequireAdmin>
    </div>
  )
}
