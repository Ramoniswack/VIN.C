#!/usr/bin/env node
// Node 18+ has global fetch
const argv = require('minimist')(process.argv.slice(2))

const SUPABASE_URL = process.env.SUPABASE_URL
const ANON_KEY = process.env.SUPABASE_ANON_KEY
const EMAIL = argv.email || process.env.TEST_EMAIL
const PASSWORD = argv.password || process.env.TEST_PASSWORD

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env')
  process.exit(1)
}
if (!EMAIL || !PASSWORD) {
  console.error('Provide --email and --password or set TEST_EMAIL/TEST_PASSWORD in .env')
  process.exit(1)
}

async function main() {
  const tokenRes = await global.fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const tokenJson = await tokenRes.json()
  if (!tokenJson.access_token) {
    console.error('Sign-in failed', tokenJson)
    process.exit(1)
  }
  const accessToken = tokenJson.access_token
  console.log('Got access token, calling API...')

  const res = await global.fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Test from script', slug: `script-${Date.now()}`, price: 1000, images: [] }),
  })
  const out = await res.text()
  console.log('API response:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
