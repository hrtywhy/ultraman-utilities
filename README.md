# Ultraman Utilities

A SOC analyst toolkit — IP/domain/hash triage, defang/refang, Safelink and
QR decoding, WHOIS, Base64 decoding, and remote file-finder commands — with
every "live" lookup (VirusTotal, AbuseIPDB, OTX, Shodan, etc.) actually
working, with the API keys never exposed publicly, even though this repo
itself is public.

## ⚠️ Before anything else

If you're reusing keys that were ever hardcoded in a config file, pasted
into a chat, or committed to a repo, **rotate them first.** A key exposed
anywhere outside a secrets manager should be treated as compromised.

## How the "public repo, private keys" part works

This repo is safe to make public because **the keys never live in it.**
There are two layers:

1. **Locally**, keys live in `.env` (for `npm run dev`, via Vite's dev-server
   proxy in `vite.config.ts`) or `.dev.vars` (for testing the Cloudflare
   Function locally via `wrangler pages dev`). Both files are gitignored —
   check `.gitignore` if you don't believe it.
2. **In production**, keys live as **encrypted secrets in the Cloudflare
   Pages dashboard**, entered by hand, never committed. Cloudflare injects
   them into the deployed Function at request time. GitHub only ever sees
   `functions/api/[[path]].js`, which contains the *routing logic*, not any
   actual key value.

This also fixes something the old client-only version couldn't: because the
proxy now runs **server-side** on Cloudflare's edge instead of in the
browser, the CORS restrictions that blocked VirusTotal, AbuseIPDB, OTX,
Criminal IP, and Maltiverse from working in a browser-only version no longer
apply. CORS only restricts browser-to-third-party calls; a server calling
another server has no such restriction. Once deployed, every source in the
"IP Search" and "Domain Search" reports should return real data, provided
its key is set.

## Deploying (public repo + private keys)

1. Push this project to a **public GitHub repo** — `functions/api/[[path]].js`
   and everything else is safe to commit as-is. Just double-check `.env` and
   `.dev.vars` were never committed (they're gitignored, but check `git status`
   if you're unsure — especially if you ever removed them from .gitignore).
2. Go to the Cloudflare dashboard → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git** → select this repo.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. Your site goes live at `your-project.pages.dev`.
5. **Now add your keys**: Pages project → **Settings** → **Environment
   variables** → add each of the variables below as a **Secret** (encrypted),
   for the Production environment (and Preview too, if you want preview
   deployments to also have live data).
6. Trigger a redeploy (or just wait for the next push) so the Function picks
   up the new secrets.

Variables to add as secrets:

```
VT_API_KEY
ABUSEIPDB_API_KEY
OTX_API_KEY
IPQS_API_KEY
APIVOID_API_KEY
CRIMINALIP_API_KEY
PULSEDIVE_API_KEY
MALTIVERSE_API_KEY
SHODAN_API_KEY
```

Optional (proxied, not yet wired into any UI tool):
`MXTOOLBOX_API_KEY`, `CENSYS_API_KEY_BASE64`, `ROSTI_API_KEY`, `ABUSECH_API_KEY`

## Local development

Two ways to run this locally, depending on what you're testing:

**Fast iteration on the UI** (proxy via Vite, keys from `.env`):
```bash
npm install
cp .env.example .env   # fill in your own keys
npm run dev
```
Visit `http://localhost:5000`.

**Testing the actual Cloudflare Function** (closer to production):
```bash
npm install
npm run build
cp .dev.vars.example .dev.vars   # fill in your own keys
npx wrangler pages dev dist
```

## What's wired up live vs. link-only

| Tool | Live sources | Needs a key |
|---|---|---|
| IP Search | Geolocation, AbuseIPDB, VT, IPQS, OTX, IPVoid/APIVoid, Criminal IP, Pulsedive, Maltiverse, Shodan, iCloud Relay | Geolocation & iCloud Relay: no. Rest: yes |
| Domain Search | urlscan.io, VT, OTX, Pulsedive, Maltiverse | urlscan.io: no. Rest: yes |
| MAC Vendor Lookup | macvendors.com | No |
| Hash Search, Safelink Decoder, QR Decoder, WHOIS Search, Base64 Decoder, Remote File Finder | — | No network calls needing a key |

## Project structure

```
functions/api/[[path]].js   # Cloudflare Pages Function — the production proxy
vite.config.ts               # Vite dev-server proxy — the local-dev proxy
.env.example                  # local dev keys (npm run dev)
.dev.vars.example             # local Functions testing keys (wrangler pages dev)
src/
  lib/api.ts                  # typed fetch wrappers, call relative /api/* paths
  lib/refang.ts                 # shared defang/refang helpers
  lib/toast.tsx                  # toast context for copy confirmations
  components/                     # ToolCard, SourceReport (multi-source live report)
  tools/                            # one component per tool
  App.tsx                            # sidebar nav + tool registry
```

Both proxies (`vite.config.ts` for local dev, `functions/api/[[path]].js` for
production) implement the same routing table independently, since they run
in different runtimes (Node for Vite, Workers for Pages Functions). If you
add a new source, you'll want to add it to both.
