import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/authStore";
import { supabase } from '@/lib/supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const signInWithSupabase = useAuthStore(state => state.signInWithSupabase)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Attempt Supabase sign-in using email (username) and password
      const ok = await signInWithSupabase(username, password, true)
      if (!ok) {
        setError('Invalid credentials')
        return
      }

      // Check whether the user is in admin list (backend reads Admin table)
      // Include current session token for protected admin routes
      let token: string | null = null
      try {
        // Try to get session from supabase client in a safe way
        const client = supabase as unknown as SupabaseClient
        const resp = await (client.auth.getSession() as Promise<{ data?: { session?: { access_token?: string } } }>)
        token = resp?.data?.session?.access_token ?? localStorage.getItem('supabase_access_token') ?? null
      } catch (e) {
        token = localStorage.getItem('supabase_access_token') ?? null
      }

      const buildHeaders = () => {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        try {
          const t = token ?? (localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? null)
          if (t) headers.Authorization = `Bearer ${t}`
          const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
          const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
          if (isDev && devAuthEnabled) headers['X-ADMIN'] = '1'
          if (username) headers['X-USER-EMAIL'] = String(username).trim().toLowerCase()
          else if (isDev) headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
        } catch (e) { /* ignore */ }
        return headers
      }

      const resp = await fetch('/api/admin/emails', { headers: buildHeaders() })
      const data = await resp.json()
      const emails: string[] = (data?.emails || []).map((s: string) => s.toLowerCase())
      // Fallback to env-configured admin emails (useful in dev/local .env)
      const envList = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      const normalized = username.trim().toLowerCase()
      const isAdmin = emails.includes(normalized) || envList.includes(normalized)
      if (!isAdmin) {
        setError('Account is not an admin')
        return
      }

      // Mark store as authenticated admin user and persist to avoid rehydration overwriting
      useAuthStore.setState({ user: { username: normalized, isAdmin: true }, isAuthenticated: true })
      try {
        localStorage.setItem('vinc-auth-storage', JSON.stringify({ state: { user: { username: normalized, isAdmin: true }, isAuthenticated: true } }))
      } catch (e) { console.warn('persist auth storage failed', e) }
      // In local/dev, ensure the backend has an Admin record so protected endpoints work.
      try {
        if (import.meta.env.DEV) {
          const headers = buildHeaders()
          headers['X-ADMIN-EDIT'] = '1'
          await fetch('/api/admin/emails', { method: 'POST', headers, body: JSON.stringify({ email: username }) })
        }
      } catch (e) {
        // ignore
      }
      navigate('/admin')
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <Card className="w-full max-w-md border-graphite/30 bg-transparent">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-display font-medium text-paper">Admin Login</CardTitle>
            <CardDescription className="text-graphite">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-paper">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent border-graphite/30 focus:border-accent/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-paper">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-graphite/30 focus:border-accent/50"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-accent text-ink hover:bg-accent/90"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-graphite/20 pt-4">
            <p className="text-sm text-graphite">
              Use your admin email and password to sign in.
            </p>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
