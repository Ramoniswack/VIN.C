import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

function isValidUrl(value: string) {
  try {
    // URL constructor will throw for invalid strings
    new URL(value)
    return true
  } catch {
    return false
  }
}

let _supabase: unknown = null

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase auth will be disabled until you add them to .env.local and restart the dev server.')
}

if (SUPABASE_URL && SUPABASE_ANON_KEY && isValidUrl(SUPABASE_URL)) {
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} else {
  if (SUPABASE_URL && !isValidUrl(SUPABASE_URL)) {
    console.error(`VITE_SUPABASE_URL appears malformed: "${SUPABASE_URL}". It must be a full URL like https://<project-ref>.supabase.co (no surrounding quotes).`)
  }

  // Provide a minimal fallback object so importing code doesn't trigger an uncaught exception.
  // Any attempt to use auth or from() will throw a clear error pointing to the missing config.
  _supabase = {
    auth: {
      signIn: async () => {
        throw new Error('Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and restart the dev server.')
      },
      signUp: async () => {
        throw new Error('Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and restart the dev server.')
      },
      signOut: async () => {
        throw new Error('Supabase client not configured.')
      },
    },
    from: () => ({
      select: async () => {
        throw new Error('Supabase client not configured.')
      },
      insert: async () => {
        throw new Error('Supabase client not configured.')
      },
    }),
  }
}

export const supabase = _supabase as ReturnType<typeof createClient> | {
  auth: { signIn: (...args: unknown[]) => Promise<never>; signUp: (...args: unknown[]) => Promise<never>; signOut: (...args: unknown[]) => Promise<never> }
  from: (...args: unknown[]) => Promise<never>
}
