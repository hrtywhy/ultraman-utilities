import React, { useState } from 'react';
import { useCopy } from '../lib/toast';
import { virusTotalFileReport, HashReport } from '../lib/api';

function getHashes(input: string) {
  return input.split('\n').map((s) => s.trim()).filter(Boolean);
}
function hashUrls(h: string) {
  return {
    ha: `https://www.hybrid-analysis.com/search?query=${h}`,
    joe: `https://www.joesandbox.com/analysis/search?q=${h}`,
  };
}

// Same red/green verdict cue used by the IP/Domain reports.
function rowClass(label: string, value: string) {
  if (label === 'Verdict') return value === 'Malicious' ? ' bad' : ' good';
  if (label === 'Detections') {
    if (/^0\//.test(value)) return ' good';
    if (/^[1-9]/.test(value)) return ' bad';
  }
  return '';
}

export function HashSearch() {
  const [input, setInput] = useState('');
  const [reports, setReports] = useState<HashReport[]>([]);
  const [busy, setBusy] = useState(false);
  const copy = useCopy();

  const analyze = async () => {
    const hashes = getHashes(input);
    if (!hashes.length) return;
    setBusy(true);
    setReports(hashes.map((h) => ({ hash: h, status: 'loading', rows: [] })));
    const done = await Promise.all(hashes.map((h) => virusTotalFileReport(h)));
    setReports(done);
    setBusy(false);
  };

  const openFirst = (key: 'ha' | 'joe') => {
    const h = getHashes(input)[0];
    if (h) window.open(hashUrls(h)[key], '_blank');
  };

  const asText = () =>
    reports
      .map((r) =>
        r.status === 'err'
          ? `${r.hash}\n  ${r.error}`
          : `${r.hash}\n${r.rows.map((row) => `  ${row.label}: ${row.value}`).join('\n')}`
      )
      .join('\n\n');

  const hasData = reports.some((r) => r.status !== 'loading');

  return (
    <>
      <label htmlFor="hashInput">Hash(es), one per line (MD5 / SHA1 / SHA256)</label>
      <textarea id="hashInput" placeholder="44d88612fea8a8f36de82e1278abb02f" value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={analyze} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze'}</button>
        {hasData && (
          <>
            <button className="small" onClick={() => openFirst('ha')}>Open Hybrid-Analysis</button>
            <button className="small" onClick={() => openFirst('joe')}>Open Joe Sandbox</button>
            <button className="small" onClick={() => copy(asText())}>Copy result</button>
          </>
        )}
      </div>

      {reports.map((r) => (
        <div className="ip-report" key={r.hash} style={{ marginTop: 14 }}>
          <div className="ip-report-header">
            <div className="ip-report-title">
              <span className="ip-report-ip" style={{ fontSize: 13, wordBreak: 'break-all' }}>{r.hash}</span>
              <span className="ip-report-country">VirusTotal file report</span>
            </div>
          </div>
          <div>
            {r.status === 'loading' && (
              <div className="ip-row">
                <span className="ip-row-dot" />
                <div className="ip-row-value muted"><span className="status-line"><span className="spinner" />Checking…</span></div>
              </div>
            )}
            {r.status === 'err' && (
              <div className="ip-row">
                <span className="ip-row-dot bad" />
                <div className="ip-row-label">VirusTotal</div>
                <div className="ip-row-value bad">{r.error}</div>
              </div>
            )}
            {r.status === 'ok' && r.rows.map((row) => (
              <div className="ip-row" key={row.label}>
                <span className={'ip-row-dot' + (rowClass(row.label, row.value) || ' neutral')} />
                <div className="ip-row-label">{row.label}</div>
                <div className={'ip-row-value' + rowClass(row.label, row.value)}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="hint">Live VirusTotal lookup per hash. Open buttons use the <b>first</b> hash in the list.</div>
    </>
  );
}
