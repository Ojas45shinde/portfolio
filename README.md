# Ojas Shinde — Portfolio

A Vite + React + Tailwind portfolio site: Hero, About, Projects,
Certifications, Connect, and Contact — with an owner-only edit mode for
adding/editing projects and certifications straight from the live site.

- **UI code**: `src/App.jsx`
- **Data layer**: `src/lib/db.js` + `src/lib/supabaseClient.js`
  (public reads via Supabase, gated writes via a Supabase Edge Function)
- **Backend**: `supabase/schema.sql` (table + RLS) and
  `supabase/functions/portfolio-write` (the only thing allowed to write)

## Quick start

```bash
npm install
cp .env.example .env   # fill in after completing Part 1 of DEPLOY.md
npm run dev
```

## Deploying

See **[DEPLOY.md](./DEPLOY.md)** for the full walkthrough — Supabase
setup, generating your owner passcode, and step-by-step instructions for
Vercel, GitHub Pages, and Netlify/Cloudflare Pages, including custom
domains.
