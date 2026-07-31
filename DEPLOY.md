# Deploying your portfolio — full walkthrough

This project is a plain static site (Vite + React) that talks to a small
Supabase backend for storage. Because the "backend" lives on Supabase, you
can host the site itself **anywhere** — Vercel, GitHub Pages, Netlify,
Cloudflare Pages — and it'll work the same way. Pick whichever you like at
the bottom; the Supabase setup in Part 1 is required either way.

Total time: ~20–30 minutes the first time.

---

## Part 1 — Supabase (the data + the owner passcode)

1. Go to https://supabase.com → create a free account → **New project**.
   Save the database password it gives you somewhere safe (you likely
   won't need it again for this).

2. Once the project is ready, open **SQL Editor** → **New query**, paste
   the contents of `supabase/schema.sql` from this folder, and run it.
   This creates the `portfolio_data` table and locks it down so only
   *reads* are public — no direct writes from the browser are possible.

3. Go to **Project Settings → API**. Copy two values, you'll need them
   soon:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / public key**

4. **Choose your owner passcode** and turn it into a SHA-256 hash (this
   is what the server checks against — your real passcode is never
   stored anywhere). Run this in any terminal with Node installed:

   ```bash
   node -e "console.log(require('crypto').createHash('sha256').update('YOUR-PASSCODE-HERE').digest('hex'))"
   ```

   Copy the long hex string it prints out.

5. Install the Supabase CLI and deploy the Edge Function that gates all
   writes:

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF   # from your project URL
   supabase secrets set OWNER_PASSCODE_HASH=paste-the-hash-from-step-4
   supabase functions deploy portfolio-write --no-verify-jwt
   ```

   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to every
   Edge Function automatically — you don't set those yourself.)

6. Your write endpoint is now live at:
   `https://YOUR-PROJECT-REF.supabase.co/functions/v1/portfolio-write`

That's the entire backend. Nothing else to maintain — no server to keep
running, no database to patch.

---

## Part 2 — Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with the three values from Part 1 (project URL, anon key,
function URL). Then:

```bash
npm run dev
```

Open the local URL, click **"Owner sign in"** in the footer, and enter
your passcode to confirm everything's wired up correctly before
deploying anywhere.

---

## Part 3 — Deploy it somewhere

### Option A — Vercel (recommended, easiest custom domain setup)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → **Add New → Project** → import that repo.
   Vercel auto-detects Vite; you don't need to change any build settings.
3. Under **Environment Variables**, add the same three from your `.env`.
4. Click **Deploy**. You'll get a `your-project.vercel.app` URL
   immediately.
5. **Custom domain**: Project → Settings → Domains → add
   `ojasshinde.dev` (or whatever you own) → Vercel shows you the DNS
   records to add at your registrar (usually just an A record + CNAME).
   HTTPS is automatic.

### Option B — GitHub Pages (free, no extra account needed)

1. Push this folder to a GitHub repo.
2. Repo → **Settings → Pages** → Source: "GitHub Actions".
3. Repo → **Settings → Secrets and variables → Actions** → add
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_PORTFOLIO_FUNCTION_URL` as repository secrets.
4. If your repo is **not** named `<your-username>.github.io`, also add
   a repository **variable** (not secret) `VITE_BASE_PATH` set to
   `/your-repo-name/`.
5. Push to `main` — the included workflow
   (`.github/workflows/deploy-gh-pages.yml`) builds and deploys
   automatically. Your site appears at
   `https://<username>.github.io/<repo>/`.
6. **Custom domain**: Settings → Pages → add your domain in the "Custom
   domain" box, then at your registrar add a CNAME record pointing to
   `<username>.github.io`. GitHub issues HTTPS automatically after DNS
   propagates (can take up to a few hours).

### Option C — Netlify / Cloudflare Pages

Same idea as Vercel: connect the repo, build command `npm run build`,
publish directory `dist`, add the three env vars, deploy. Both support
custom domains with automatic HTTPS.

---

## After deploying

- Visit your live URL, click **Owner sign in** in the footer, enter your
  passcode — you'll now see the "Add project", "Add certification", and
  edit-profile controls. Everyone else just sees the finished site.
- To change your passcode later: run step 4 in Part 1 again with a new
  phrase, then `supabase secrets set OWNER_PASSCODE_HASH=...` and
  redeploy the function (`supabase functions deploy portfolio-write --no-verify-jwt`).
  Sign out and back in everywhere it matters.
- Content (projects, certs, profile) lives in Supabase, not in your git
  repo — so adding a project from the live site doesn't require a
  redeploy at all. Redeploys are only needed when you change the code
  itself.

## A note on security

The write path is checked **server-side** in the Edge Function — the
passcode never reaches the database directly, and the public anon key
your browser uses genuinely cannot write to the table (enforced by the
Row Level Security policy). That's meaningfully more secure than a
client-side-only check. It's still a single shared passcode with no
rate-limiting, so treat it like you would any small site's admin
password: reasonably long, not reused from somewhere sensitive.
