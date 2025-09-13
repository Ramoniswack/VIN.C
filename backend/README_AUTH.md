Supabase Auth setup and local test

1. Copy `.env.example` to `.env` and fill in your Supabase keys:

   - `SUPABASE_URL` (project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key - server only)
   - `SUPABASE_ANON_KEY` (anon public key)

2. Restart dev server:

   cd backend
   npm run dev

3. Create a user in Supabase dashboard (Auth → Users) or via the anon key.

4. Run the test script (it will sign in the user and call the protected endpoint):

   npm run test:auth --email you@example.com --password Passw0rd!

Notes:

- Do NOT commit your `.env` to git.
- The test script uses the anon key to sign in and then calls the backend with the returned access token.
