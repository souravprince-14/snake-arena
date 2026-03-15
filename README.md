# Snake Arena

A standalone browser-playable Snake app with:

- Email/password login
- Display name tracking
- Shared high-score leaderboard
- GitHub Pages deployment
- Supabase auth and database

## Stack

- Static frontend: HTML, CSS, JavaScript
- Auth + database: Supabase
- Hosting: GitHub Pages

## Setup

### 1. Create a Supabase project

Create a project in Supabase, then copy:

- Project URL
- Project anon key or publishable key

Official docs:

- [Supabase JavaScript client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Password-based auth](https://supabase.com/docs/guides/auth/passwords)

### 2. Create the database tables and policies

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

### 3. Add your project keys

Edit `config.js` and replace:

- `YOUR_SUPABASE_URL`
- `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY`

Important:

- The anon key or publishable key is safe to use in a browser app when your Row Level Security policies are correct.
- Never put your service role key in this project.

### 4. Auth setting for easiest testing

For a casual demo, go to Supabase Auth settings and disable email confirmation, or players will need to confirm their email before they can sign in.

If you keep email confirmation enabled:

- Set your Supabase Site URL to your GitHub Pages URL
- Add your GitHub Pages URL to Redirect URLs

For this repo, that will likely be:

- `https://souravprince-14.github.io/<new-repo-name>/`

### 5. Run locally

Open `index.html` in a browser.

### 6. Deploy on GitHub Pages

1. Push this folder to its own GitHub repo.
2. In GitHub, open `Settings` -> `Pages`.
3. Choose `Deploy from a branch`.
4. Select `main` and `/ (root)`.
5. Save and wait for the Pages URL.

## Database behavior

- `profiles` stores each user's display name
- `high_scores` stores one best score per user
- The leaderboard shows the top 10 scores
- Users can only write their own profile and score
- Everyone can read the leaderboard

## Manual verification

- Sign up with email, password, and display name
- Sign in and see your saved display name
- The game stays locked until login is complete
- Beat your current best score and refresh the page
- Confirm your best score remains on the leaderboard
- Open a second browser or account and confirm both users appear on the leaderboard

## What I still cannot do from the repo alone

- Create the Supabase project for you
- Paste your real project URL and public key into `config.js`
- Change your hosted Supabase Auth dashboard settings on your behalf

Once those are filled in, this repo is ready for GitHub Pages deployment.
