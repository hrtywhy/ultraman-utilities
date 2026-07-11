import React, { useState } from 'react';
import { refangText } from '../lib/refang';
import { SourceReportRow, useSourceReport, Source } from '../components/SourceReport';
import * as api from '../lib/api';

const SOURCES: Source[] = [
  { id: 'geo', label: 'IP-Geolocation', run: api.geolocateIp },
  { id: 'abuseipdb', label: 'AbuseIPDB', run: api.abuseIpDb },
  { id: 'vt', label: 'VT Scan', run: api.virusTotalIp },
  { id: 'ipqs', label: 'IPQS (VPN/Proxy)', run: api.ipqs },
  { id: 'otx', label: 'OTX', run: api.otxIp },
  { id: 'ipvoid', label: 'IPVoid', run: api.apiVoidIp },
  { id: 'criminalip', label: 'Criminal IP', run: api.criminalIp },
  { id: 'pulsedive', label: 'Pulsedive', run: api.pulsedive },
  { id: 'maltiverse', label: 'Maltiverse', run: api.maltiverseIp },
  { id: 'shodan', label: 'Shodan', run: api.shodan },
  { id: 'icloud', label: 'iCloud Relay', run: api.icloudRelayCheck },
];

export function IpSearch() {
  const [ip, setIp] = useState('');
  const [header, setHeader] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const { rows, run } = useSourceReport(SOURCES);

  const analyze = async () => {
    const clean = refangText(ip.trim());
    if (!clean) return;
    setAnalyzed(true);
    setHeader(`IP Address: ${clean} [resolving country…]`);
    run(clean);
    try {
      const country = await api.geolocateIpCountry(clean);
      setHeader(`IP Address: ${clean} [${country}]`);
    } catch {
      setHeader(`IP Address: ${clean} [country unknown]`);
    }
  };

  return (
    <>
      <label htmlFor="ipInput">IP address</label>
      <input id="ipInput" type="text" placeholder="195.178.110.137" value={ip} onChange={(e) => setIp(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={analyze}>Analyze</button>
      </div>
      {analyzed && (
        <div className="ip-report">
          <div className="ip-report-header">{header}</div>
          <div>
            {SOURCES.map((s) => (
              <SourceReportRow key={s.id} label={s.label} state={rows[s.id]} />
            ))}
          </div>
        </div>
      )}
      <div className="hint">
        Every source here is backed by the dev-server proxy — keys live only in your <b>.env</b> file. A source
        with no key configured will show an auth error rather than fabricated data.
      </div>
    </>
  );
}
