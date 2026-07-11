import React, { useState } from 'react';
import { refangText } from '../lib/refang';
import { SourceReportRow, useSourceReport, Source } from '../components/SourceReport';
import * as api from '../lib/api';

const SOURCES: Source[] = [
  { id: 'urlscan', label: 'urlscan.io', run: api.urlscanDomain },
  { id: 'vt', label: 'VT Scan', run: api.virusTotalDomain },
  { id: 'otx', label: 'OTX', run: api.otxDomain },
  { id: 'pulsedive', label: 'Pulsedive', run: api.pulsedive },
  { id: 'maltiverse', label: 'Maltiverse', run: api.maltiverseHostname },
];

export function DomainSearch() {
  const [domain, setDomain] = useState('');
  const [header, setHeader] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const { rows, run } = useSourceReport(SOURCES);

  const analyze = () => {
    const clean = refangText(domain.trim());
    if (!clean) return;
    setAnalyzed(true);
    setHeader(`Domain: ${clean}`);
    run(clean);
  };

  const openTalos = () => {
    const clean = refangText(domain.trim());
    if (clean) window.open(`https://talosintelligence.com/reputation_center/lookup?search=${clean}`, '_blank');
  };

  return (
    <>
      <label htmlFor="domainInput">Domain</label>
      <input id="domainInput" type="text" placeholder="evil.example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={analyze}>Analyze</button>
        <button className="small" onClick={openTalos}>Open Talos (no API available)</button>
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
        urlscan.io needs no key at all. The rest read their key from <b>.env</b> via the proxy. Talos has no public
        API, so that stays a manual link.
      </div>
    </>
  );
}
