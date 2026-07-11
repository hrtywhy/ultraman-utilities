import React, { useState } from 'react';
import { refangText } from '../lib/refang';
import { SourceReportRow, useSourceReport, reportToText, reportHasData, Source } from '../components/SourceReport';
import { useCopy } from '../lib/toast';
import * as api from '../lib/api';

const SOURCES: Source[] = [
  { id: 'urlscan', label: 'urlscan.io', run: api.urlscanDomain },
  { id: 'vt', label: 'VT Scan', run: api.virusTotalDomain },
  { id: 'otx', label: 'OTX', run: api.otxDomain },
  { id: 'pulsedive', label: 'Pulsedive', run: api.pulsedive },
  { id: 'maltiverse', label: 'Maltiverse', run: api.maltiverseHostname },
  { id: 'talos', label: 'Talos Intelligence', run: api.talosDomain },
];

export function DomainSearch() {
  const [domain, setDomain] = useState('');
  const [header, setHeader] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const { rows, run } = useSourceReport(SOURCES);
  const copy = useCopy();

  const analyze = () => {
    const clean = api.cleanHostname(domain);
    if (!clean) return;
    setAnalyzed(true);
    setHeader(clean);
    run(clean);
  };

  return (
    <>
      <label htmlFor="domainInput">Domain</label>
      <input id="domainInput" type="text" placeholder="evil.example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={analyze}>Analyze</button>
        {analyzed && reportHasData(rows) && (
          <button className="small" onClick={() => copy(`Domain: ${header}\n${reportToText(SOURCES, rows)}`)}>Copy result</button>
        )}
      </div>
      {analyzed && (
        <div className="ip-report">
          <div className="ip-report-header">
            <div className="ip-report-title">
              <span className="ip-report-ip">{header}</span>
              <span className="ip-report-country">Domain reputation</span>
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
        urlscan.io needs no key at all. The rest read their key from <b>.env</b> via the proxy. Talos has no public
        API (it blocks automated lookups), so that row links to the official reputation center.
      </div>
    </>
  );
}
