# Supabase Setup

This app uses:

- Supabase Auth for email/password login
- `profiles` for display names
- `high_scores` for one best score per user

## Dashboard checklist

### 1. Create a new project

In Supabase, create a new project and wait for it to finish provisioning.

### 2. Get your browser-safe keys

From the project's Connect dialog or API settings, copy:

- Project URL
- Anon key or publishable key

Put them in:

- `config.js`

Do not use the service role key in the frontend.

### 3. Run the SQL schema

Open the SQL editor and run:

- `supabase/schema.sql`

That creates:

- `profiles`
- `high_scores`
- Row Level Security policies

### 4. Configure email/password auth

Email/password auth is enabled by default in Supabase.

For easiest testing:

- Go to `Authentication` -> `Providers` -> `Email`
- Turn off email confirmation

If you want email confirmation kept on:

- Go to `Authentication` -> `URL Configuration`
- Set `Site URL` to your deployed GitHub Pages URL
- Add that same URL under redirect URLs

Example:

- `https://souravprince-14.github.io/your-new-repo-name/`

Supabase docs say email/password auth is enabled by default, and hosted projects require email confirmation by default unless you turn it off.

Sources:

- [Password-based Auth | Supabase Docs](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Docs](https://supabase.com/docs/)

### 5. Test the app

1. Open your deployed site
2. Create an account with email, password, and display name
3. Sign in
4. Play a game and beat score `0`
5. Confirm your score appears in the leaderboard
6. Open another browser or account and confirm the leaderboard is shared

## Recommended free setup

- Host frontend on GitHub Pages
- Use Supabase free tier for auth and leaderboard storage

This is the simplest way to get a shared login-based Snake leaderboard live without adding a backend server.
