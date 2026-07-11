import React, { useState } from 'react';
import { macVendor } from '../lib/api';

export function MacVendorLookup() {
  const [mac, setMac] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'ok' | 'err'; msg: string }>({ kind: 'idle', msg: '' });
  const [out, setOut] = useState('');

  const run = async () => {
    if (!mac.trim()) { setStatus({ kind: 'err', msg: 'Enter a MAC address first.' }); return; }
    setStatus({ kind: 'loading', msg: 'Looking up vendor…' });
    setOut('');
    try {
      const vendor = await macVendor(mac.trim());
      setStatus({ kind: 'ok', msg: 'Found.' });
      setOut(vendor);
    } catch (e: any) {
      setStatus({ kind: 'err', msg: e.message });
    }
  };

  return (
    <>
      <label htmlFor="macInput">MAC address</label>
      <input id="macInput" type="text" placeholder="FC:FB:FB:01:FA:21" value={mac} onChange={(e) => setMac(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={run}>Look up vendor</button>
      </div>
      {status.kind !== 'idle' && (
        <div className={'status-line' + (status.kind === 'ok' ? ' ok' : status.kind === 'err' ? ' err' : '')}>
          {status.kind === 'loading' && <span className="spinner" />}
          <span className="dot" />{status.msg}
        </div>
      )}
      <div className="result-box">{out}</div>
      <div className="hint">Calls the free macvendors.com API directly from your browser (no proxy needed — it's already public/CORS-friendly). That service rate-limits by IP.</div>
    </>
  );
}
