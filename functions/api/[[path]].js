// Cloudflare Pages Function — catches every request under /api/*
// Deployed alongside the static build, running server-side on Cloudflare's
// edge. Because this runs on a server (not in the browser), the CORS
// restrictions that block direct browser calls to VT/AbuseIPDB/OTX/etc.
// simply don't apply here — the browser only ever talks to this same-origin
// /api/* endpoint, and this function does the cross-origin fetch for it.
//
// All keys come from `env`, which Cloudflare populates from the encrypted
// secrets you set in the Pages dashboard (Settings > Environment variables).
// Nothing here is ever committed to the repo.

const HEADER_ROUTES = [
  {
    prefix: '/api/virustotal',
    target: 'https://www.virustotal.com',
    requiredKey: 'VT_API_KEY',
    headers: (env) => ({ 'x-apikey': env.VT_API_KEY || '' }),
  },
  {
    prefix: '/api/abuseipdb',
    target: 'https://api.abuseipdb.com',
    requiredKey: 'ABUSEIPDB_API_KEY',
    headers: (env) => ({ Key: env.ABUSEIPDB_API_KEY || '', Accept: 'application/json' }),
  },
  {
    prefix: '/api/otx',
    target: 'https://otx.alienvault.com',
    requiredKey: 'OTX_API_KEY',
    headers: (env) => ({ 'X-OTX-API-KEY': env.OTX_API_KEY || '' }),
  },
  {
    prefix: '/api/criminalip',
    target: 'https://api.criminalip.io',
    requiredKey: 'CRIMINALIP_API_KEY',
    headers: (env) => ({ 'x-api-key': env.CRIMINALIP_API_KEY || '' }),
  },
  {
    prefix: '/api/maltiverse',
    target: 'https://api.maltiverse.com',
    requiredKey: 'MALTIVERSE_API_KEY',
    headers: (env) => ({ Authorization: `Bearer ${env.MALTIVERSE_API_KEY || ''}` }),
  },
  {
    prefix: '/api/mxtoolbox',
    target: 'https://api.mxtoolbox.com',
    requiredKey: 'MXTOOLBOX_API_KEY',
    headers: (env) => ({ Authorization: env.MXTOOLBOX_API_KEY || '' }),
  },
  {
    prefix: '/api/censys',
    target: 'https://search.censys.io',
    requiredKey: 'CENSYS_API_KEY_BASE64',
    headers: (env) => ({ Authorization: `Basic ${env.CENSYS_API_KEY_BASE64 || ''}` }),
  },
  {
    prefix: '/api/rosti',
    target: 'https://api.rosti.bin.re/v2',
    requiredKey: 'ROSTI_API_KEY',
    headers: (env) => ({ 'X-API-Key': env.ROSTI_API_KEY || '' }),
  },
  {
    prefix: '/api/urlhaus',
    target: 'https://urlhaus-api.abuse.ch',
    requiredKey: 'ABUSECH_API_KEY',
    headers: (env) => ({ 'Auth-Key': env.ABUSECH_API_KEY || '' }),
  },
  {
    prefix: '/api/threatfox',
    target: 'https://threatfox-api.abuse.ch',
    requiredKey: 'ABUSECH_API_KEY',
    headers: (env) => ({ 'Auth-Key': env.ABUSECH_API_KEY || '' }),
  },
  {
    // No key needed — proxied for consistency and to sidestep any CORS friction.
    prefix: '/api/urlscan',
    target: 'https://urlscan.io',
    headers: () => ({}),
  },
  {
    // No key needed. Proxied because ipapi.co sends no CORS headers, so the
    // browser can't call it directly from the deployed site.
    prefix: '/api/geoip',
    target: 'https://ipapi.co',
    headers: () => ({}),
  },
  {
    // No key needed. Proxied because mask-api.icloud.com sends no CORS
    // headers — direct browser fetches fail with "Failed to fetch".
    prefix: '/api/icloudrelay',
    target: 'https://mask-api.icloud.com',
    headers: () => ({}),
  },
  {
    // No key needed. Proxied for the same CORS reason as above.
    prefix: '/api/macvendors',
    target: 'https://api.macvendors.com',
    headers: () => ({}),
  },
  {
    // No key needed (keyless free tier). VPN/proxy/Tor/datacenter detection.
    prefix: '/api/ipapiis',
    target: 'https://api.ipapi.is',
    headers: () => ({}),
  },
];

// Services that take their key as a query param rather than a header.
const QUERY_KEY_ROUTES = [
  { prefix: '/api/shodan', target: 'https://api.shodan.io', param: 'key', requiredKey: 'SHODAN_API_KEY', key: (env) => env.SHODAN_API_KEY },
  // Pulsedive has a keyless free tier — forward with the key if set, without
  // one otherwise (no requiredKey gate), so it still returns data on prod.
  { prefix: '/api/pulsedive', target: 'https://pulsedive.com', param: 'key', key: (env) => env.PULSEDIVE_API_KEY },
];

// Forwarding a request with a blank key produces confusing upstream errors.
// Fail fast instead with a clear message the UI can surface.
function missingKeyResponse(varName) {
  return new Response(
    JSON.stringify({ error: `API key not configured: set the ${varName} secret (Cloudflare Pages dashboard) or .env/.dev.vars locally` }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  for (const r of QUERY_KEY_ROUTES) {
    if (path.startsWith(r.prefix)) {
      if (r.requiredKey && !env[r.requiredKey]) return missingKeyResponse(r.requiredKey);
      const rest = path.slice(r.prefix.length);
      const targetUrl = new URL(r.target + rest);
      url.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
      targetUrl.searchParams.set(r.param, r.key(env) || '');
      return fetch(targetUrl.toString());
    }
  }

  for (const r of HEADER_ROUTES) {
    if (path.startsWith(r.prefix)) {
      if (r.requiredKey && !env[r.requiredKey]) return missingKeyResponse(r.requiredKey);
      const rest = path.slice(r.prefix.length);
      const targetUrl = new URL(r.target + rest);
      url.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

      const init = { method: request.method, headers: r.headers(env) };
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
      }
      return fetch(targetUrl.toString(), init);
    }
  }

  return new Response('Not found', { status: 404 });
}
