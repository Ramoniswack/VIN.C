import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/store/authStore'

type Order = any

export function OrdersManager() {
  // auth store saves tokens in local/session storage; expose via helper keys
  const token = (typeof window !== 'undefined') ? (localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken')) : null
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const evtRef = useRef<EventSource | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchPage = async (p = 1) => {
    try {
      const res = await fetch(`/api/admin/orders/list?page=${p}&pageSize=20`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const json = await res.json()
      if (json.ok) {
        setOrders(json.items)
        setTotal(json.total || 0)
        setPage(json.page || 1)
      }
    } catch (e) { console.warn('fetch orders failed', e) }
  }

  const fetchOrderDetail = async (id: number) => {
    try {
      const token = (typeof window !== 'undefined') ? (localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken')) : null
      const headers: Record<string,string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/admin/orders/${id}`, { headers })
      const json = await res.json()
      if (json.ok) {
        setSelectedOrder(json.order)
        setDetailOpen(true)
      }
    } catch (e) { console.warn('fetch order detail failed', e) }
  }

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const token = (typeof window !== 'undefined') ? (localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken')) : null
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status }) })
      const json = await res.json()
      if (json.ok) {
        // optimistic update
        setOrders(prev => prev.map(o => o.id === json.order.id ? json.order : o))
        setSelectedOrder(json.order)
      }
    } catch (e) { console.warn('update order status failed', e) }
  }

  useEffect(() => { fetchPage(1) }, [])

  useEffect(() => {
  // connect SSE. In development, EventSource cannot set headers, so append
  // query params x-admin=1 and x-user-email for the backend dev bypass.
  const devEmail = (import.meta.env && (import.meta.env.VITE_DEV_USER_EMAIL as string)) || 'dev@example.com'
  const streamUrl = import.meta.env && import.meta.env.DEV ? `/api/admin/orders/stream?x-admin=1&x-user-email=${encodeURIComponent(devEmail)}` : '/api/admin/orders/stream'
  const s = new EventSource(streamUrl)
    evtRef.current = s
    s.addEventListener('order.created', (e: any) => {
      try { const data = JSON.parse((e as MessageEvent).data); setOrders(prev => [data, ...prev]) } catch (err) { console.warn(err) }
    })
    s.addEventListener('order.paid', (e: any) => {
      try { const data = JSON.parse((e as MessageEvent).data); setOrders(prev => prev.map(o => o.id === data.id ? data : o)) } catch (err) { console.warn(err) }
    })
    s.addEventListener('order.updated', (e: any) => {
      try { const data = JSON.parse((e as MessageEvent).data); setOrders(prev => prev.map(o => o.id === data.id ? data : o)) } catch (err) { console.warn(err) }
    })
    s.onerror = (err) => { console.warn('SSE error', err); s.close() }
    return () => { s.close() }
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Orders</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => fetchPage(page)}>Refresh</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o: any) => (
            <TableRow key={o.id} onClick={() => fetchOrderDetail(o.id)} className="cursor-pointer hover:bg-slate-50">
              <TableCell>{o.id}</TableCell>
              <TableCell>{o.email || o.user?.email}</TableCell>
              <TableCell>{o.amountTotal}</TableCell>
              <TableCell>{o.status}</TableCell>
              <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) setSelectedOrder(null); setDetailOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div>
              <div className="mb-2">Id: {selectedOrder.id}</div>
              <div className="mb-2">Email: {selectedOrder.email}</div>
              <div className="mb-2">Amount: {selectedOrder.amountTotal}</div>
              <div className="mb-4">Status: {selectedOrder.status}</div>
              <div className="flex space-x-2">
                <Button onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}>Mark Shipped</Button>
                <Button onClick={() => updateOrderStatus(selectedOrder.id, 'refunded')}>Mark Refunded</Button>
                <Button variant="ghost" onClick={() => { setDetailOpen(false); setSelectedOrder(null) }}>Close</Button>
              </div>
            </div>
          ) : (<div>Loading…</div>)}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdersManager
