# Ultraman Utilities

Ultraman utilities is a swiss army knife for security analyst that help to  check IP/domain/hash triage, defang/refang, Safelink and QR decoding, WHOIS, Base64 decoding, and remote file-finder commands with connection to several threat sharing platform

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
