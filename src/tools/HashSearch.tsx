import React, { useState } from 'react';
import { useCopy } from '../lib/toast';

function getHashes(input: string) {
  return input.split('\n').map((s) => s.trim()).filter(Boolean);
}
function hashUrls(h: string) {
  return {
    vt: `https://www.virustotal.com/gui/file/${h}`,
    ha: `https://www.hybrid-analysis.com/search?query=${h}`,
    joe: `https://www.joesandbox.com/analysis/search?q=${h}`,
  };
}

export function HashSearch() {
  const [input, setInput] = useState('');
  const [out, setOut] = useState('');
  const copy = useCopy();

  const generate = () => {
    const hashes = getHashes(input);
    const lines = hashes.flatMap((h) => {
      const u = hashUrls(h);
      return [h, `  VT:              ${u.vt}`, `  Hybrid-Analysis: ${u.ha}`, `  Joe Sandbox:     ${u.joe}`, ''];
    });
    setOut(lines.join('\n').trim());
  };
  const openFirst = (key: 'vt' | 'ha' | 'joe') => {
    const h = getHashes(input)[0];
    if (h) window.open(hashUrls(h)[key], '_blank');
  };

  return (
    <>
      <label htmlFor="hashInput">Hash(es), one per line (MD5 / SHA1 / SHA256)</label>
      <textarea id="hashInput" placeholder="44d88612fea8a8f36de82e1278abb02f" value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={generate}>Generate URLs</button>
        <button className="small" onClick={() => openFirst('vt')}>Open VT (first hash)</button>
        <button className="small" onClick={() => openFirst('ha')}>Open Hybrid-Analysis (first hash)</button>
        <button className="small" onClick={() => openFirst('joe')}>Open Joe Sandbox (first hash)</button>
        <button className="small" onClick={() => copy(out)}>Copy result</button>
      </div>
      <div className="result-box">{out}</div>
      <div className="hint">Open buttons only use the <b>first</b> hash in the list.</div>
    </>
  );
}
