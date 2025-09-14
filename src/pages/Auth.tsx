import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const signInWithSupabase = useAuthStore(state => state.signInWithSupabase)
  const signUpWithSupabase = useAuthStore(state => state.signUpWithSupabase)

  const handleSocial = (provider: 'google' | 'facebook') => {
    // Open OAuth flow via Supabase
    const client = supabase as unknown as SupabaseClient
    // Force Google to show consent and request offline access so we get refresh tokens
    client.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin + '/auth',
        // queryParams are appended to the provider authorize URL
        queryParams: {
          prompt: 'consent',
          access_type: 'offline',
          include_granted_scopes: 'true'
        }
      }
    })
      .then(({ data, error }) => {
        if (error) console.error('OAuth error', error)
        if (data?.url) {
          console.debug('OAuth redirect url', data.url)
          window.location.href = data.url
        }
      })
      .catch((e) => console.error(e))
  };

  const buildHeaders = useCallback((overrideEmail?: string) => {
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    try {
      const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
      if (token) headers.Authorization = `Bearer ${token}`
      const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
      const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
      if (isDev && devAuthEnabled) headers['X-ADMIN'] = '1'
      if (overrideEmail) headers['X-USER-EMAIL'] = String(overrideEmail).trim().toLowerCase()
      else if (isDev) headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
    } catch (e) { /* ignore */ }
    return headers
  }, [])

  // Remove oauthPending: we will auto-finalize OAuth

  // demo admin login removed - use real admin accounts managed via backend

  // Handle OAuth redirect: supabase may append access_token on redirect
  useEffect(() => {
    const handle = async () => {
      try {
  // capture tokens from URL (if provider returned them in query or fragment)

        const url = new URL(window.location.href)
        let token = url.searchParams.get('access_token')
        let refresh = url.searchParams.get('refresh_token')
        if (!token && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, '')
          const frag = new URLSearchParams(hash)
          token = frag.get('access_token')
          refresh = frag.get('refresh_token')
        }
        if (token) {
          // Persist tokens locally for API calls (and legacy 'authToken' for older backends)
          try {
            localStorage.setItem('supabase_access_token', token)
            localStorage.setItem('authToken', token)
            if (refresh) localStorage.setItem('supabase_refresh_token', refresh)
          } catch (e) {
            console.warn('Storage set failed', e)
          }

          // Set session in the client so supabase.auth.getUser() works
          const client = supabase as unknown as SupabaseClient
          console.debug('Attempting client.auth.setSession with token', token.substring(0, 20) + '...')
          let setErr = null
          try {
            const res = await client.auth.setSession({ access_token: token, refresh_token: refresh ?? '' })
            // v2 returns { data, error }
            setErr = res?.error
            console.debug('setSession result', res)
          } catch (e) {
            console.error('setSession threw', e)
            setErr = e
          }

          if (setErr) {
            console.error('Error setting session after OAuth', setErr)
            // bail out but keep tokens in storage for manual debugging
            return
          }

          // Confirm session has a user before redirecting. Retry once if necessary.
          let userData = null
          try {
            const s = await client.auth.getSession()
            console.debug('getSession after setSession', s)
            const got = await client.auth.getUser()
            console.debug('getUser after setSession', got)
            userData = got?.data?.user ?? null
          } catch (e) {
            console.error('Error getting user after setSession', e)
          }

          if (!userData) {
            // Try one more time after a short wait (some providers may delay)
            await new Promise(r => setTimeout(r, 500))
            try {
              const got2 = await client.auth.getUser()
              console.debug('getUser retry', got2)
              userData = got2?.data?.user ?? null
            } catch (e) {
              console.error('Retry getUser failed', e)
            }
          }

          if (userData) {
            const email = (userData as { email?: string }).email ?? ''
            // determine admin by querying backend admin list with env fallback
            const envAdminList = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
              .split(',')
              .map(s => s.trim().toLowerCase())
              .filter(Boolean)
            const fetchAdminList = async (): Promise<string[]> => {
              try {
                const resp = await fetch('/api/admin/emails', { headers: buildHeaders(email) })
                if (!resp.ok) throw new Error('no admin API')
                const json = await resp.json()
                const server = (json.emails || []).map((s: string) => s.toLowerCase())
                return Array.from(new Set([...envAdminList, ...server]))
              } catch (e) {
                return envAdminList
              }
            }
            const adminList = await fetchAdminList()
            const isAdmin = adminList.includes(email.toLowerCase())
            const newState = { user: { username: email, isAdmin }, isAuthenticated: true }
            useAuthStore.setState(newState)
            // Also update the persisted zustand key immediately so rehydration won't overwrite
            try {
              localStorage.setItem('vinc-auth-storage', JSON.stringify({ state: newState }))
            } catch (e) {
              console.warn('Failed writing vinc-auth-storage', e)
            }
            console.info('OAuth login finalized for', email)
            // Expose store for debugging in DEV (kept minimal)
            if (import.meta.env.DEV) {
              // @ts-expect-error - only used for debugging in dev
              window.__VINC_AUTH = useAuthStore
            }
            // Also update the persisted zustand storage to avoid rehydration overwriting this state
            try {
              const key = 'vinc-auth-storage'
              const raw = localStorage.getItem(key)
              if (raw) {
                const parsed = JSON.parse(raw)
                if (parsed && typeof parsed === 'object') {
                  if (parsed.state) {
                    parsed.state.user = { username: email, isAdmin: newState.user.isAdmin }
                    parsed.state.isAuthenticated = true
                  } else {
                    parsed.user = { username: email, isAdmin: newState.user.isAdmin }
                    parsed.isAuthenticated = true
                  }
                  localStorage.setItem(key, JSON.stringify(parsed))
                }
              } else {
                localStorage.setItem(key, JSON.stringify({ state: { user: { username: email, isAdmin: newState.user.isAdmin }, isAuthenticated: true } }))
              }
            } catch (e) {
              console.warn('Failed to update persisted auth state', e)
            }
            // Remove tokens from URL fragment for cleanliness
            try {
              const cleaned = window.location.origin + window.location.pathname
              window.history.replaceState({}, document.title, cleaned)
            } catch (e) {
              // ignore
            }
            // Redirect to user dashboard
            // respect optional next param so an interrupted flow can continue
            try {
              const url = new URL(window.location.href)
              const next = url.searchParams.get('next')
              if (next) {
                const decoded = decodeURIComponent(next)
                navigate(decoded)
              } else {
                navigate(newState.user.isAdmin ? '/admin' : '/dashboard')
              }
            } catch (e) {
              navigate(newState.user.isAdmin ? '/admin' : '/dashboard')
            }
          } else {
            console.warn('No user after setSession; tokens left in storage for debugging')
          }
        }
      } catch (e) {
        console.error('Error handling OAuth redirect', e)
      }
    }
    handle()
  }, [navigate, buildHeaders])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const ok = await signInWithSupabase(email, password, rememberMe)
        if (ok) {
          // after normal login, determine admin status and navigate accordingly
          const envAdminList = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
          const fetchAdminList = async (): Promise<string[]> => {
              try {
                const resp = await fetch('/api/admin/emails', { headers: buildHeaders(email) })
                if (!resp.ok) throw new Error('no admin API')
                const json = await resp.json()
                const server = (json.emails || []).map((s: string) => s.toLowerCase())
                return Array.from(new Set([...envAdminList, ...server]))
              } catch (e) {
                return envAdminList
              }
          }
          const adminList = await fetchAdminList()
          const isAdmin = adminList.includes(email.toLowerCase())
          useAuthStore.setState({ user: { username: email, isAdmin }, isAuthenticated: true })
          try { localStorage.setItem('vinc-auth-storage', JSON.stringify({ state: { user: { username: email, isAdmin }, isAuthenticated: true } })) } catch (e) { console.warn('persist auth storage failed', e) }

          // respect next param
          const q = new URLSearchParams(window.location.search)
          const next = q.get('next')
          if (next) navigate(decodeURIComponent(next))
          else navigate(isAdmin ? '/admin' : '/dashboard')
        } else setError('Invalid credentials')
      } else {
        const ok = await signUpWithSupabase(email, password, rememberMe)
        if (ok) {
          setMode('login')
          setError('Account created - please login')
        } else {
          setError('Signup failed')
        }
      }
    } catch (err) {
      setError('An error occurred')
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-20 min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-md mx-auto">
          {/* Auth form panel centered */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
            <div className="mb-6">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-black dark:text-white text-center">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 text-center">{mode === 'login' ? 'Sign in to access your dashboard, wishlist and faster checkout.' : 'Join VIN.C to save favorites, track orders and enjoy special drops.'}</p>
            </div>

            <div className="space-y-5">
              <Button
                className="w-full group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-3 rounded-lg py-3 transition-shadow shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-800"
                onClick={() => handleSocial('google')}
                aria-label={mode === 'login' ? 'Login with Google' : 'Sign up with Google'}
              >
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l6-5.8C34.9 4.1 30.8 2.5 24 2.5 14.8 2.5 7.2 7.9 4.1 15.6l7.4 5.7C12.2 15.1 17.6 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-2.9-.4-4.2H24v7.9h12.7c-.5 2.7-2 4.9-4.2 6.4l6.5 5c3.8-3.5 6-8.8 6-15.1z"/>
                  <path fill="#4A90E2" d="M11.5 29.3c-.8-2.4-1.2-4.6-1.2-7.3s.4-4.9 1.2-7.3L4 9.1C1.5 13.5 0 18.4 0 24c0 5.6 1.5 10.5 4 14.9l7.5-9.6z"/>
                  <path fill="#FBBC05" d="M24 46.5c6.8 0 12.5-2.2 16.7-5.9L34.2 35.6C31.9 37 28.3 38 24 38c-7.2 0-13.2-4.6-15.4-11.1l-7.5 9.6C7.2 40.6 14.8 46.5 24 46.5z"/>
                </svg>
                <span className="text-black dark:text-white font-semibold">{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
              </Button>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">Or use your email</div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="name" className="text-sm text-gray-700 dark:text-gray-200">Full name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white" />
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-200">Email</Label>
                  <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-200">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-md pr-10 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white" />
                    <button type="button" className="absolute right-2 top-2 text-sm text-gray-400 dark:text-gray-300" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <Label htmlFor="remember" className="mb-0 text-sm text-gray-700 dark:text-gray-200">Remember me</Label>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Forgot password?</div>
                </div>
                {error && <div className="text-red-600">{error}</div>}
                <Button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#b88925] text-black rounded-lg py-3 shadow-md">{mode === 'login' ? 'Login' : 'Create account'}</Button>

                {/* Elegant secondary gesture below the CTA */}
                <div className="mt-4 text-center">
                  {mode === 'signup' ? (
                    <button onClick={() => setMode('login')} className="inline-flex items-center text-sm text-black dark:text-white hover:text-black dark:hover:text-white transition-colors">
                      <span className="mr-2">Already a user?</span>
                      <span className="text-[#D4AF37] font-medium underline decoration-1 underline-offset-2">Login</span>
                    </button>
                  ) : (
                    <button onClick={() => setMode('signup')} className="inline-flex items-center text-sm text-black dark:text-white hover:text-black dark:hover:text-white transition-colors">
                      <span className="mr-2">New to VIN.C?</span>
                      <span className="text-[#D4AF37] font-medium underline decoration-1 underline-offset-2">Create account</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
