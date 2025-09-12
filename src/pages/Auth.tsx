import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSocial = (provider: 'google' | 'facebook') => {
    // Stub: integrate real OAuth here (Supabase, Firebase, or your backend)
    console.log('Social auth', provider);
    // For demo, navigate to home
    navigate('/');
  };

  const demoAdminLogin = async () => {
    // demo login using auth store
    const ok = await useAuthStore.getState().login('admin', 'admin123');
    if (ok) navigate('/admin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Demo: use the simple auth store for admin login only
    try {
      const ok = await login(email, password);
      if (ok) navigate('/');
      else setError('Invalid credentials for demo');
    } catch (err) {
      setError('An error occurred');
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
                  <Button
                    className="w-full bg-[#1877F2] text-white flex items-center justify-center space-x-3 rounded-lg py-3 transition-none hover:!bg-[#1877F2] hover:!text-white shadow-sm"
                    onClick={() => handleSocial('facebook')}
                    aria-label={mode === 'login' ? 'Login with Facebook' : 'Sign up with Facebook'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.12 8.44 9.92v-7.03H7.9v-2.89h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.23 0-1.62.77-1.62 1.56v1.87h2.77l-.44 2.89h-2.33v7.03C18.34 21.19 22 17.06 22 12.07z" fill="#fff"/></svg>
                    <span className="font-semibold">{mode === 'login' ? 'Login with Facebook' : 'Sign up with Facebook'}</span>
                  </Button>
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
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-md" />
                  </div>
                  {error && <div className="text-red-600">{error}</div>}
                  <Button type="submit" className="w-full bg-accent text-ink rounded-lg py-3">{mode === 'login' ? 'Login' : 'Sign up'}</Button>
                  <Button type="button" variant="ghost" className="w-full mt-2" onClick={demoAdminLogin}>Demo admin login</Button>
                </form>
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
