import React, { useState } from 'react';
import { refangText } from '../lib/refang';
import { useCopy } from '../lib/toast';

export function WhoisSearch() {
  const [input, setInput] = useState('');
  const [out, setOut] = useState('');
  const copy = useCopy();

  const url = () => {
    const target = refangText(input.trim());
    return target ? `https://www.whois.com/whois/${target}` : '';
  };

  return (
    <>
      <label htmlFor="whoisInput">Domain or IP</label>
      <input id="whoisInput" type="text" placeholder="example.com" value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={() => setOut(url())}>Generate URL</button>
        <button className="small" onClick={() => { const u = url(); if (u) window.open(u, '_blank'); }}>Open WHOIS</button>
        {out && <button className="small" onClick={() => copy(out)}>Copy result</button>}
      </div>
      {out && <div className="result-box">{out}</div>}
    </>
  );
}
