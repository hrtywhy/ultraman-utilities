import React, { useState } from 'react';
import { useCopy } from '../lib/toast';

function decodeSafelink(input: string) {
  const s = input.trim();
  try {
    const u = new URL(s);
    if (u.searchParams.has('url')) return decodeURIComponent(u.searchParams.get('url')!);
    if (u.hostname.includes('urldefense') && u.searchParams.has('u')) {
      let enc = u.searchParams.get('u')!;
      enc = enc.replace(/-/g, '%').replace(/_/g, '/');
      try { return decodeURIComponent(enc); } catch { return enc; }
    }
    for (const key of ['u', 'redirect', 'target', 'dest', 'q']) {
      if (u.searchParams.has(key)) return decodeURIComponent(u.searchParams.get(key)!);
    }
    return "No recognized wrapper parameter found — this may already be a direct URL, or use an unsupported wrapper.";
  } catch {
    return 'Not a valid URL.';
  }
}

export function SafelinkDecoder() {
  const [input, setInput] = useState('');
  const [out, setOut] = useState('');
  const copy = useCopy();

  return (
    <>
      <label htmlFor="slInput">Wrapped / obfuscated URL</label>
      <textarea
        id="slInput"
        placeholder="https://nam02.safelinks.protection.outlook.com/?url=https%3A%2F%2Fevil.example.com%2Fpath&data=..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="btn-row">
        <button className="primary" onClick={() => setOut(decodeSafelink(input))}>Decode</button>
        {out && <button className="small" onClick={() => copy(out)}>Copy result</button>}
      </div>
      {out && <div className="result-box">{out}</div>}
    </>
  );
}
