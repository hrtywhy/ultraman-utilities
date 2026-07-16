import React, { useState } from 'react';
import { refangText } from '../lib/refang';
import { SourceReportRow, useSourceReport, reportToText, reportHasData, Source } from '../components/SourceReport';
import { useCopy } from '../lib/toast';
import * as api from '../lib/api';

const SOURCES: Source[] = [
  { id: 'geo', label: 'IP-Geolocation', run: api.geolocateIp },
  { id: 'vpnproxy', label: 'VPN / Proxy', run: api.vpnProxy },
  { id: 'abuseipdb', label: 'AbuseIPDB', run: api.abuseIpDb },
  { id: 'vt', label: 'VT Scan', run: api.virusTotalIp },
  { id: 'otx', label: 'OTX', run: api.otxIp },
  { id: 'criminalip', label: 'Criminal IP', run: api.criminalIp },
  { id: 'pulsedive', label: 'Pulsedive', run: api.pulsedive },
  { id: 'maltiverse', label: 'Maltiverse', run: api.maltiverseIp },
  { id: 'shodan', label: 'Shodan', run: api.shodan },
  { id: 'icloud', label: 'iCloud Relay', run: api.icloudRelayCheck },
];

type Geo = { country: string; code: string } | null;

export function IpSearch() {
  const [ip, setIp] = useState('');
  const [target, setTarget] = useState('');
  const [geo, setGeo] = useState<Geo>(null);
  const [geoPending, setGeoPending] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const { rows, run } = useSourceReport(SOURCES);
  const copy = useCopy();

  const analyze = async () => {
    const clean = refangText(ip.trim());
    if (!clean) return;
    setAnalyzed(true);
    setTarget(clean);
    setGeo(null);
    setGeoPending(true);
    run(clean);
    try {
      setGeo(await api.geolocateIpMeta(clean));
    } catch {
      setGeo(null);
    } finally {
      setGeoPending(false);
    }
  };

  return (
    <>
      <label htmlFor="ipInput">IP address</label>
      <input id="ipInput" type="text" placeholder="195.178.110.137" value={ip} onChange={(e) => setIp(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={analyze}>Analyze</button>
        {analyzed && reportHasData(rows) && (
          <button className="small" onClick={() => copy(`IP: ${target}${geo ? ` [${geo.country}]` : ''}\n${reportToText(SOURCES, rows)}`)}>Copy result</button>
        )}
      </div>
      {analyzed && (
        <div className="ip-report">
          <div className="ip-report-header">
            {geo?.code && (
              <img
                className="ip-report-flag"
                src={`https://flagcdn.com/40x30/${geo.code}.png`}
                srcSet={`https://flagcdn.com/80x60/${geo.code}.png 2x`}
                alt={`${geo.country} flag`}
              />
            )}
            <div className="ip-report-title">
              <span className="ip-report-ip">{target}</span>
              <span className="ip-report-country">
                {geoPending ? 'resolving country…' : geo ? geo.country : 'country unknown'}
              </span>
            </div>
          </div>
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
