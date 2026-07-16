import { defineConfig, loadEnv, ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

// All API keys are read from environment variables (see .env.example).
// They are only ever used here, server-side, inside this Node process.
// The browser never sees them — it only ever calls relative /api/* paths,
// and this dev server attaches the real key before forwarding the request.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const appendKeyParam = (basePath: string, keyParam: string, keyValue: string) => {
    const sep = basePath.includes('?') ? '&' : '?';
    return keyValue ? `${basePath}${sep}${keyParam}=${keyValue}` : basePath;
  };

  const proxy: Record<string, ProxyOptions> = {
    // ---- Header-authenticated APIs ----
    '/api/virustotal': {
      target: 'https://www.virustotal.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/virustotal/, ''),
      headers: { 'x-apikey': env.VT_API_KEY || '' },
    },
    '/api/abuseipdb': {
      target: 'https://api.abuseipdb.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/abuseipdb/, ''),
      headers: { Key: env.ABUSEIPDB_API_KEY || '', Accept: 'application/json' },
    },
    '/api/otx': {
      target: 'https://otx.alienvault.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/otx/, ''),
      headers: { 'X-OTX-API-KEY': env.OTX_API_KEY || '' },
    },
    '/api/criminalip': {
      target: 'https://api.criminalip.io',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/criminalip/, ''),
      headers: { 'x-api-key': env.CRIMINALIP_API_KEY || '' },
    },
    '/api/maltiverse': {
      target: 'https://api.maltiverse.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/maltiverse/, ''),
      headers: { Authorization: `Bearer ${env.MALTIVERSE_API_KEY || ''}` },
    },
    // ---- Query-param-authenticated APIs (key injected into the URL server-side) ----
    '/api/shodan': {
      target: 'https://api.shodan.io',
      changeOrigin: true,
      rewrite: (p) => appendKeyParam(p.replace(/^\/api\/shodan/, ''), 'key', env.SHODAN_API_KEY || ''),
    },
    '/api/pulsedive': {
      target: 'https://pulsedive.com',
      changeOrigin: true,
      rewrite: (p) => appendKeyParam(p.replace(/^\/api\/pulsedive/, ''), 'key', env.PULSEDIVE_API_KEY || ''),
    },
    // ---- No key required, proxied only to sidestep any CORS friction ----
    '/api/urlscan': {
      target: 'https://urlscan.io',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/urlscan/, ''),
    },
    '/api/geoip': {
      target: 'https://ipapi.co',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/geoip/, ''),
    },
    '/api/icloudrelay': {
      target: 'https://mask-api.icloud.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/icloudrelay/, ''),
    },
    '/api/macvendors': {
      target: 'https://api.macvendors.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/macvendors/, ''),
    },
    '/api/ipapiis': {
      target: 'https://api.ipapi.is',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/ipapiis/, ''),
    },

    // ---- Available but not yet wired into the UI (kept for future tools) ----
    '/api/mxtoolbox': {
      target: 'https://api.mxtoolbox.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/mxtoolbox/, ''),
      headers: { Authorization: env.MXTOOLBOX_API_KEY || '' },
    },
    '/api/censys': {
      target: 'https://search.censys.io',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/censys/, ''),
      headers: { Authorization: `Basic ${env.CENSYS_API_KEY_BASE64 || ''}` },
    },
    '/api/rosti': {
      target: 'https://api.rosti.bin.re/v2',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/rosti/, ''),
      headers: { 'X-API-Key': env.ROSTI_API_KEY || '' },
    },
    '/api/urlhaus': {
      target: 'https://urlhaus-api.abuse.ch',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/urlhaus/, ''),
      headers: { 'Auth-Key': env.ABUSECH_API_KEY || '' },
    },
    '/api/threatfox': {
      target: 'https://threatfox-api.abuse.ch',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/threatfox/, ''),
      headers: { 'Auth-Key': env.ABUSECH_API_KEY || '' },
    },
  };

  return {
    server: { port: 5000, host: '0.0.0.0', proxy },
    plugins: [react()],
  };
});
