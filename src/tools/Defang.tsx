import React, { useState } from 'react';
import { defangText, refangText } from '../lib/refang';
import { useCopy } from '../lib/toast';

export function Defang() {
  const [input, setInput] = useState('');
  const [out, setOut] = useState('');
  const copy = useCopy();

  return (
    <>
      <label htmlFor="dfInput">Input (IPs, URLs, emails — any mix)</label>
      <textarea
        id="dfInput"
        placeholder="https://evil.example.com, attacker@evil.com, 192.0.2.10"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="btn-row">
        <button className="primary" onClick={() => setOut(defangText(input))}>Defang</button>
        <button onClick={() => setOut(refangText(input))}>Refang</button>
        {out && <button className="small" onClick={() => copy(out)}>Copy result</button>}
      </div>
      {out && <div className="result-box">{out}</div>}
    </>
  );
}
