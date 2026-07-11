// All calls here hit relative /api/* paths handled by vite.config.ts's proxy.
// The real third-party API keys live only in .env, read server-side — nothing
// here ever touches a key directly, which is the whole point of the proxy.

async function proxyFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401 || res.status === 403) {
    throw new Error('Auth rejected — check the matching key in your .env file');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export async function geolocateIp(ip: string) {
  const res = await fetch(`https://ipapi.co/${ip}/json/`);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'lookup failed');
  return `${data.city}, ${data.region}, ${data.country_name}, ${data.latitude}, ${data.longitude}, ${data.org || 'N/A'}`;
}
export async function geolocateIpCountry(ip: string) {
  const res = await fetch(`https://ipapi.co/${ip}/json/`);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'lookup failed');
  return data.country_name as string;
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
  const res = await proxyFetch(`/api/virustotal/api/v3/domains/${domain}`);
  const attrs = (await res.json()).data.attributes;
  const stats = attrs.last_analysis_stats;
  const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0);
  return `${stats.malicious > 0 ? 'Malicious' : 'Clean'}, ${stats.malicious}/${total} detections`;
}

export async function ipqs(ip: string) {
  const res = await proxyFetch(`/api/ipqs/${ip}`);
  const data = await res.json();
  if (data.success === false) throw new Error(data.message || 'lookup failed');
  const isVpnProxy = data.vpn || data.proxy;
  return `VPN/Proxy: ${isVpnProxy ? 'True' : 'False'} (Type: ${data.connection_type || 'N/A'}, Risk: ${data.fraud_score})`;
}

export async function otxIp(ip: string) {
  const res = await proxyFetch(`/api/otx/api/v1/indicators/IPv4/${ip}/general`);
  const data = await res.json();
  const count = data.pulse_info ? data.pulse_info.count : 0;
  return `${count} pulse${count === 1 ? '' : 's'} reference this IP`;
}
export async function otxDomain(domain: string) {
  const res = await proxyFetch(`/api/otx/api/v1/indicators/domain/${domain}/general`);
  const data = await res.json();
  const count = data.pulse_info ? data.pulse_info.count : 0;
  return `${count} pulse${count === 1 ? '' : 's'} reference this domain`;
}

export async function apiVoidIp(ip: string) {
  const res = await proxyFetch(`/api/apivoid/v2/ip-reputation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip }),
  });
  const data = await res.json();
  const engines = (data.blacklists && data.blacklists.engines) || {};
  const detections = Object.values(engines).filter((e: any) => e.detected).length;
  return `Blacklist Count : ${detections}`;
}

export async function criminalIp(ip: string) {
  const res = await proxyFetch(`/api/criminalip/v1/ip/summary?ip=${ip}`);
  const data = await res.json();
  return `Score inbound ${data.score?.inbound ?? 'N/A'} / outbound ${data.score?.outbound ?? 'N/A'}, ${data.country || 'N/A'}`;
}

export async function pulsedive(indicator: string) {
  const res = await proxyFetch(`/api/pulsedive/api/info.php?indicator=${indicator}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return `Risk: ${data.risk || 'unknown'}`;
}

export async function maltiverseIp(ip: string) {
  const res = await proxyFetch(`/api/maltiverse/ip/${ip}`);
  const data = await res.json();
  return `Classification: ${data.classification || 'unknown'}`;
}
export async function maltiverseHostname(domain: string) {
  const res = await proxyFetch(`/api/maltiverse/hostname/${domain}`);
  const data = await res.json();
  return `Classification: ${data.classification || 'unknown'}`;
}

export async function shodan(ip: string) {
  const res = await proxyFetch(`/api/shodan/shodan/host/${ip}`);
  const data = await res.json();
  return `${(data.ports || []).length} open ports, org: ${data.org || 'N/A'}`;
}

export async function urlscanDomain(domain: string) {
  const res = await proxyFetch(`/api/urlscan/api/v1/search/?q=domain:${domain}`);
  const data = await res.json();
  const total = data.total ?? (data.results ? data.results.length : 0);
  return `${total} scan${total === 1 ? '' : 's'} on record for this domain`;
}

let icloudRangesCache: string[] | null = null;
export async function icloudRelayCheck(ip: string) {
  if (!icloudRangesCache) {
    const res = await fetch('https://mask-api.icloud.com/egress-ip-ranges.csv');
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
  const res = await fetch(`https://api.macvendors.com/${encodeURIComponent(mac)}`);
  const text = await res.text();
  if (!res.ok) throw new Error(res.status === 404 ? 'No vendor found for that MAC.' : `HTTP ${res.status} (possibly rate-limited)`);
  return text;
}
