import React, { useState } from 'react';
import { useCopy } from '../lib/toast';

function base64ToBytes(cleaned: string) {
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function printableRatio(str: string) {
  if (!str.length) return 0;
  let ok = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0)!;
    if (code === 0xfffd) continue;
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) ok++;
  }
  return ok / str.length;
}

export function Base64Decoder() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'err' | 'warn'; msg: string }>({ kind: 'idle', msg: '' });
  const [out, setOut] = useState('');
  const copy = useCopy();

  const run = () => {
    const notes: string[] = [];
    let cleaned = input.replace(/\s+/g, '');
    if (!cleaned) { setStatus({ kind: 'err', msg: 'Enter a Base64 string first.' }); setOut(''); return; }

    let recoveredPartial = false;
    const originalLength = cleaned.length;
    let remainder = cleaned.length % 4;
    if (remainder === 1) {
      cleaned = cleaned.slice(0, -1);
      recoveredPartial = true;
      notes.push(`Length was invalid (${originalLength} chars, remainder 1) — trimmed the last dangling character.`);
      remainder = cleaned.length % 4;
    }
    if (remainder) cleaned += '='.repeat(4 - remainder);

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(cleaned);
    } catch {
      const allowed = /[A-Za-z0-9+/=_-]/g;
      let fallback = (cleaned.match(allowed) || []).join('').replace(/-/g, '+').replace(/_/g, '/');
      let fbRemainder = fallback.length % 4;
      if (fbRemainder === 1) { fallback = fallback.slice(0, -1); recoveredPartial = true; fbRemainder = fallback.length % 4; }
      if (fbRemainder) fallback += '='.repeat(4 - fbRemainder);
      try {
        bytes = base64ToBytes(fallback);
        notes.push('Strict decoding failed — recovered using a cleaned fallback (removed characters outside the Base64 alphabet).');
      } catch {
        setStatus({ kind: 'err', msg: "Could not decode — this doesn't look like valid Base64." });
        setOut('');
        return;
      }
    }

    if (recoveredPartial) notes.push('Output may be incomplete — the input looked truncated or corrupted.');
    const prefix = notes.length ? notes.map((n) => 'Note: ' + n).join('\n') + '\n\n' : '';

    let utf16Bytes = bytes;
    let trimmedOddByte = false;
    if (utf16Bytes.length % 2 === 1) { utf16Bytes = utf16Bytes.slice(0, -1); trimmedOddByte = true; }
    if (utf16Bytes.length > 0) {
      try {
        const text = new TextDecoder('utf-16le', { fatal: false }).decode(utf16Bytes);
        if (printableRatio(text) >= 0.85) {
          const noteExtra = trimmedOddByte ? prefix + 'Note: Trimmed 1 dangling byte to align to UTF-16LE 2-byte code units.\n\n' : prefix;
          setStatus({ kind: 'ok', msg: 'Decoded as UTF-16LE (PowerShell-style encoded command).' });
          setOut(noteExtra + text);
          return;
        }
      } catch { /* fall through */ }
    }

    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (printableRatio(text) >= 0.85) {
        setStatus({ kind: 'ok', msg: 'Decoded as UTF-8.' });
        setOut(prefix + text);
        return;
      }
    } catch { /* fall through */ }

    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    setStatus({ kind: 'warn', msg: "Decoded output isn't clean text in UTF-16LE or UTF-8 — showing raw hex." });
    setOut(prefix + hex);
  };

  return (
    <>
      <label htmlFor="b64Input">Base64 string</label>
      <textarea id="b64Input" placeholder="JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdA..." value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={run}>Decode</button>
        <button className="small" onClick={() => copy(out)}>Copy result</button>
      </div>
      {status.kind !== 'idle' && (
        <div className={'status-line' + (status.kind === 'ok' ? ' ok' : status.kind === 'err' ? ' err' : '')}>
          <span className="dot" />{status.msg}
        </div>
      )}
      <div className="result-box">{out}</div>
      <div className="hint">Tries UTF-16LE first (how PowerShell's <b>-EncodedCommand</b> encodes scripts), then UTF-8, then falls back to hex. Also recovers Base64 that's missing padding or has one dangling character from a partial copy-paste.</div>
    </>
  );
}
