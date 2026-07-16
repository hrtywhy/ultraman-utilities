// All calls here hit relative /api/* paths handled by vite.config.ts's proxy.
// The real third-party API keys live only in .env, read server-side — nothing
// here ever touches a key directly, which is the whole point of the proxy.
import { refangText } from './refang';

// A source result is either plain text or text plus a link to render inline.
export type SourceResult = string | { text: string; href: string; linkLabel?: string };

async function proxyFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401 || res.status === 403) {
    let detail = '';
    try { detail = (await res.clone().json()).error || ''; } catch { /* not JSON */ }
    throw new Error(detail || 'Auth rejected — missing/invalid API key (.env locally, Cloudflare Pages secret in prod)');
  }
  if (res.status === 429) throw new Error('Rate limited by the upstream service — try again shortly');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// Reduce any user input (URL, subdomain path, defanged text) to a bare
// hostname. VirusTotal/OTX return 400/404 when handed a scheme or path, which
// is what caused the Domain Search errors.
export function cleanHostname(input: string): string {
  let s = refangText(input.trim()).trim();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, ''); // strip scheme
  s = s.split('/')[0].split('?')[0].split('#')[0]; // strip path/query/fragment
  s = s.split('@').pop() as string; // strip any userinfo
  s = s.replace(/:\d+$/, ''); // strip port
  s = s.replace(/\.$/, ''); // strip trailing dot
  return s.toLowerCase();
}

// Geolocation: primary is ipapi.co via our proxy (it sends no CORS headers,
// so it can't be called from the browser directly). If it fails or is
// rate-limited, fall back to ipwho.is, which is keyless and CORS-enabled.
async function geoLookup(ip: string) {
  try {
    const res = await proxyFetch(`/api/geoip/${ip}/json/`);
    const data = await res.json();
    if (data.error) throw new Error(data.reason || 'lookup failed');
    return {
      city: data.city, region: data.region, country: data.country_name,
      code: (data.country_code || '').toLowerCase(),
      lat: data.latitude, lon: data.longitude, org: data.org,
    };
  } catch {
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();
    if (data.success === false) throw new Error(data.message || 'lookup failed');
    return {
      city: data.city, region: data.region, country: data.country,
      code: (data.country_code || '').toLowerCase(),
      lat: data.latitude, lon: data.longitude, org: data.connection?.org || data.connection?.isp,
    };
  }
}
export async function geolocateIp(ip: string) {
  const g = await geoLookup(ip);
  return `${g.city}, ${g.region}, ${g.country}, ${g.lat}, ${g.lon}, ${g.org || 'N/A'}`;
}
// Country name + ISO code (for flag rendering in the IP report header).
export async function geolocateIpMeta(ip: string) {
  const g = await geoLookup(ip);
  return { country: g.country as string, code: g.code as string };
}

export async function abuseIpDb(ip: string) {
  const res = await proxyFetch(`/api/abuseipdb/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`);
  const data = (await res.json()).data;
  return `Reports ${data.totalReports}, Confidence ${data.abuseConfidenceScore}%, Domain ${data.domain || 'N/A'}`;
}

export async function virusTotalIp(ip: string) {
  const res = await proxyFetch(`/api/virustotal/api/v3/ip_addresses/${ip}`);
  const attrs = (await res.json()).data.attributes;
  const stats = attrs.last_analysis_stats;
  const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0);
  return `${stats.malicious > 0 ? 'Malicious' : 'Clean'}, ${stats.malicious}/${total} detections`;
}
export async function virusTotalDomain(domain: string) {
  const res = await proxyFetch(`/api/virustotal/api/v3/domains/${cleanHostname(domain)}`);
  const attrs = (await res.json()).data.attributes;
  const stats = attrs.last_analysis_stats;
  const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0);
  return `${stats.malicious > 0 ? 'Malicious' : 'Clean'}, ${stats.malicious}/${total} detections`;
}

export type HashReport = {
  hash: string;
  status: 'loading' | 'ok' | 'err';
  rows: { label: string; value: string }[];
  error?: string;
};

// Structured VirusTotal file report for the Hash Search report view.
export async function virusTotalFileReport(hash: string): Promise<HashReport> {
  try {
    const res = await fetch(`/api/virustotal/api/v3/files/${hash}`);
    if (res.status === 404) return { hash, status: 'err', rows: [], error: 'Not found on VirusTotal' };
    if (res.status === 401 || res.status === 403) {
      const detail = await res.json().catch(() => ({}));
      return { hash, status: 'err', rows: [], error: detail.error || 'Auth rejected — check VT_API_KEY' };
    }
    if (!res.ok) return { hash, status: 'err', rows: [], error: `HTTP ${res.status}` };
    const attrs = (await res.json()).data.attributes;
    const stats = attrs.last_analysis_stats;
    const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0);
    const label = attrs.popular_threat_classification?.suggested_threat_label;
    const name = attrs.meaningful_name || (attrs.names && attrs.names[0]) || 'unknown name';
    const size = attrs.size ? `${(attrs.size / 1024).toFixed(1)} KB` : 'N/A';
    const rows = [
      { label: 'Verdict', value: stats.malicious > 0 ? 'Malicious' : 'Clean' },
      { label: 'Detections', value: `${stats.malicious}/${total} engines` },
      { label: 'Name', value: name },
      { label: 'Type', value: attrs.type_description || 'N/A' },
      { label: 'Size', value: size },
    ];
    if (label) rows.push({ label: 'Threat label', value: label });
    return { hash, status: 'ok', rows };
  } catch (e) {
    return { hash, status: 'err', rows: [], error: e instanceof Error ? e.message : 'lookup failed' };
  }
}

// VPN / Proxy / Tor / datacenter detection via ipapi.is (keyless).
export async function vpnProxy(ip: string) {
  const res = await fetch(`/api/ipapiis/?q=${ip}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const flags: string[] = [];
  if (data.is_vpn) flags.push('VPN');
  if (data.is_proxy) flags.push('Proxy');
  if (data.is_tor) flags.push('Tor');
  if (data.is_abuser) flags.push('Abuser');
  if (flags.length) return `Anonymizer detected: ${flags.join(', ')}${data.is_datacenter ? ' (datacenter)' : ''}`;
  if (data.is_datacenter) return 'No VPN/Proxy/Tor — datacenter/hosting (not residential)';
  return 'Clean — residential, no VPN/Proxy/Tor';
}

export async function otxIp(ip: string) {
  const res = await proxyFetch(`/api/otx/api/v1/indicators/IPv4/${ip}/general`);
  const data = await res.json();
  const count = data.pulse_info ? data.pulse_info.count : 0;
  return `${count} pulse${count === 1 ? '' : 's'} reference this IP`;
}
export async function otxDomain(domain: string) {
  const res = await proxyFetch(`/api/otx/api/v1/indicators/domain/${cleanHostname(domain)}/general`);
  const data = await res.json();
  const count = data.pulse_info ? data.pulse_info.count : 0;
  return `${count} pulse${count === 1 ? '' : 's'} reference this domain`;
}

export async function criminalIp(ip: string) {
  const res = await proxyFetch(`/api/criminalip/v1/ip/summary?ip=${ip}`);
  const data = await res.json();
  return `Score inbound ${data.score?.inbound ?? 'N/A'} / outbound ${data.score?.outbound ?? 'N/A'}, ${data.country || 'N/A'}`;
}

export async function pulsedive(indicator: string) {
  // Pulsedive 404s (with an "Indicator not found" body) for anything not
  // already in its database — that's a normal answer, not a failure.
  const res = await fetch(`/api/pulsedive/api/info.php?indicator=${cleanHostname(indicator)}`);
  const data = await res.json().catch(() => ({}));
  if (data.error) {
    if (/not found/i.test(data.error)) return 'Not in Pulsedive database';
    throw new Error(data.error);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return `Risk: ${data.risk || 'unknown'}`;
}

export async function maltiverseIp(ip: string) {
  const res = await proxyFetch(`/api/maltiverse/ip/${ip}`);
  const data = await res.json();
  return `Classification: ${data.classification || 'unknown'}`;
}
export async function maltiverseHostname(domain: string) {
  const res = await proxyFetch(`/api/maltiverse/hostname/${cleanHostname(domain)}`);
  const data = await res.json();
  return `Classification: ${data.classification || 'unknown'}`;
}

// Cisco Talos has no usable API — its reputation center sits behind Cloudflare
// bot protection that returns 403 to any automated request (including from
// other Cloudflare servers). Rather than fabricate a verdict, surface a
// deep link to the official lookup so the analyst can open it in one click.
export async function talosDomain(domain: string): Promise<SourceResult> {
  const host = cleanHostname(domain);
  return {
    text: 'No public API — open the official reputation lookup:',
    href: `https://talosintelligence.com/reputation_center/lookup?search=${host}`,
    linkLabel: 'View on Talos ↗',
  };
}

export async function shodan(ip: string) {
  const res = await proxyFetch(`/api/shodan/shodan/host/${ip}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  // Map each open port to its detected service (e.g. 22/ssh, 443/https) so the
  // report shows *which* ports are open, not just how many.
  const svcByPort = new Map<number, string>();
  for (const s of data.data || []) {
    const mod = s?._shodan?.module || s?.transport;
    if (s?.port != null) svcByPort.set(s.port, mod ? `${s.port}/${mod}` : String(s.port));
  }
  const ports: number[] = data.ports || [];
  if (!ports.length) return `No open ports · org: ${data.org || 'N/A'}`;
  const list = ports.map((p) => svcByPort.get(p) || String(p)).join(', ');
  return `${ports.length} open (${list}) · org: ${data.org || 'N/A'}`;
}

export async function urlscanDomain(domain: string) {
  const res = await proxyFetch(`/api/urlscan/api/v1/search/?q=domain:${cleanHostname(domain)}`);
  const data = await res.json();
  const total = data.total ?? (data.results ? data.results.length : 0);
  return `${total} scan${total === 1 ? '' : 's'} on record for this domain`;
}

let icloudRangesCache: string[] | null = null;
export async function icloudRelayCheck(ip: string) {
  if (!icloudRangesCache) {
    // Proxied — mask-api.icloud.com sends no CORS headers.
    const res = await fetch('/api/icloudrelay/egress-ip-ranges.csv');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    icloudRangesCache = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  }
  const match = icloudRangesCache.some((line) => line.split(',')[0] && ipInCidr(ip, line.split(',')[0].trim()));
  return match ? 'True.' : 'False.';
}
function ipInCidr(ip: string, cidr: string) {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    const ipNum = ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o, 10), 0) >>> 0;
    const rangeNum = range.split('.').reduce((acc, o) => (acc << 8) + parseInt(o, 10), 0) >>> 0;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
  } catch { return false; }
}

export async function macVendor(mac: string) {
  // Proxied — api.macvendors.com sends no CORS headers.
  const res = await fetch(`/api/macvendors/${encodeURIComponent(mac)}`);
  const text = await res.text();
  if (!res.ok) throw new Error(res.status === 404 ? 'No vendor found for that MAC.' : `HTTP ${res.status} (possibly rate-limited)`);
  return text;
}
