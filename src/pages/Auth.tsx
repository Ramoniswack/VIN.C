import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
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
            // @ts-expect-error - supabase response typing may vary by version
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
                const resp = await fetch('/api/admin/emails')
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
  }, [navigate])



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
                const resp = await fetch('/api/admin/emails')
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
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-3xl rounded-lg shadow-lg overflow-hidden">
          <CardHeader className="text-center px-8 pt-8">
            <CardTitle className="text-3xl font-display">{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
            <p className="text-sm text-graphite mt-2">Create an account to save favorites, manage orders, and checkout faster.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 px-8 py-6">
                <div className="space-y-5 mb-6">
                  <Button
                    className="w-full bg-white border flex items-center justify-center space-x-3 rounded-lg py-3 transition-none hover:!bg-white hover:!text-black shadow-sm"
                    onClick={() => handleSocial('google')}
                    aria-label={mode === 'login' ? 'Login with Google' : 'Sign up with Google'}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l6-5.8C34.9 4.1 30.8 2.5 24 2.5 14.8 2.5 7.2 7.9 4.1 15.6l7.4 5.7C12.2 15.1 17.6 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-2.9-.4-4.2H24v7.9h12.7c-.5 2.7-2 4.9-4.2 6.4l6.5 5c3.8-3.5 6-8.8 6-15.1z"/>
                      <path fill="#4A90E2" d="M11.5 29.3c-.8-2.4-1.2-4.6-1.2-7.3s.4-4.9 1.2-7.3L4 9.1C1.5 13.5 0 18.4 0 24c0 5.6 1.5 10.5 4 14.9l7.5-9.6z"/>
                      <path fill="#FBBC05" d="M24 46.5c6.8 0 12.5-2.2 16.7-5.9L34.2 35.6C31.9 37 28.3 38 24 38c-7.2 0-13.2-4.6-15.4-11.1l-7.5 9.6C7.2 40.6 14.8 46.5 24 46.5z"/>
                    </svg>
                    <span className="text-black font-semibold">{mode === 'login' ? 'Login with Google' : 'Sign up with Google'}</span>
                  </Button>
                  {/* Removed Facebook social login as requested */}
                </div>
                <div className="text-center text-sm text-graphite mb-4">Or use your email</div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="rounded-md" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" className="rounded-md" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-md pr-10" />
                      <button type="button" className="absolute right-2 top-2 text-sm text-graphite" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <Label htmlFor="remember" className="mb-0">Remember me</Label>
                  </div>
                  {error && <div className="text-red-600">{error}</div>}
                  <Button type="submit" className="w-full bg-accent text-ink rounded-lg py-3">{mode === 'login' ? 'Login' : 'Sign up'}</Button>
                </form>


                {/* OAuth debug UI removed for production-ready login form */}

                {/* Dev auth panel removed to prevent demo admin access; use real admin accounts via backend */}
              </div>
              <aside className="w-full md:w-96 bg-surface/60 border-l px-6 py-6 hidden md:block">
                <div className="mb-4">
                  <div className="w-full h-40 bg-gradient-to-br from-accent/10 to-accent/5 rounded-md flex items-center justify-center p-4">
                    <div className="flex items-center space-x-4">
                      <svg className="w-12 h-12 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 2l7 3v5c0 5-3.58 9.74-7 11-3.42-1.26-7-6-7-11V5l7-3z" fill="currentColor" opacity="0.12"/>
                        <path d="M12 3.2l6.1 2.6v4.1c0 4.1-2.9 8-6.1 9-3.2-1-6.1-4.9-6.1-9V5.8L12 3.2z" stroke="currentColor" strokeWidth="0.6" fill="none"/>
                        <path d="M9.2 11.8l1.8 1.8 3.8-3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                      <div>
                        <h5 className="text-sm font-semibold">Secure & fast checkout</h5>
                        <p className="text-xs text-graphite mt-1">Payments and account data are protected with industry standards.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium">Why create an account?</h4>
                  <ul className="mt-3 space-y-2 text-sm text-graphite list-disc list-inside">
                    <li>Save favorites for later</li>
                    <li>Faster checkout with saved info</li>
                    <li>Access order history & tracking</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-graphite">Already have an account?</p>
                  <Button variant="link" className="mt-2" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create an account' : 'Login instead'}</Button>
                </div>
              </aside>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-graphite">By continuing you agree to our terms and privacy.</p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
