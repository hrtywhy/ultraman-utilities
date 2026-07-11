import React, { useState } from 'react';
import { useCopy } from '../lib/toast';
import { virusTotalFile } from '../lib/api';

function getHashes(input: string) {
  return input.split('\n').map((s) => s.trim()).filter(Boolean);
}
function hashUrls(h: string) {
  return {
    ha: `https://www.hybrid-analysis.com/search?query=${h}`,
    joe: `https://www.joesandbox.com/analysis/search?q=${h}`,
  };
}

export function HashSearch() {
  const [input, setInput] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  const copy = useCopy();

  const analyze = async () => {
    const hashes = getHashes(input);
    if (!hashes.length) return;
    setBusy(true);
    setOut(hashes.map((h) => `${h}\n  VirusTotal: querying…`).join('\n\n'));
    const results = await Promise.all(
      hashes.map(async (h) => {
        const u = hashUrls(h);
        let vt: string;
        try {
          vt = await virusTotalFile(h);
        } catch (e) {
          vt = e instanceof Error ? e.message : 'lookup failed';
        }
        return [h, `  VirusTotal:      ${vt}`, `  Hybrid-Analysis: ${u.ha}`, `  Joe Sandbox:     ${u.joe}`].join('\n');
      }),
    );
    setOut(results.join('\n\n'));
    setBusy(false);
  };
  const openFirst = (key: 'ha' | 'joe') => {
    const h = getHashes(input)[0];
    if (h) window.open(hashUrls(h)[key], '_blank');
  };

  return (
    <>
      <label htmlFor="hashInput">Hash(es), one per line (MD5 / SHA1 / SHA256)</label>
      <textarea id="hashInput" placeholder="44d88612fea8a8f36de82e1278abb02f" value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={analyze} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze'}</button>
        <button className="small" onClick={() => openFirst('ha')}>Open Hybrid-Analysis (first hash)</button>
        <button className="small" onClick={() => openFirst('joe')}>Open Joe Sandbox (first hash)</button>
        <button className="small" onClick={() => copy(out)}>Copy result</button>
      </div>
      <div className="result-box">{out}</div>
      <div className="hint">Open buttons only use the <b>first</b> hash in the list.</div>
    </>
  );
}
