import React, { useState } from 'react';
import { useCopy } from '../lib/toast';

function shQuote(v: string) { return "'" + v.replace(/'/g, "'\\''") + "'"; }
function psQuote(v: string) { return "'" + v.replace(/'/g, "''") + "'"; }

export function RemoteFileFinder() {
  const [path, setPath] = useState('');
  const [filter, setFilter] = useState('');
  const [type, setType] = useState<'file' | 'dir'>('file');
  const [os, setOs] = useState<'nix' | 'win'>('nix');
  const [out, setOut] = useState('');
  const copy = useCopy();

  const generate = () => {
    const p = path.trim() || (os === 'win' ? 'C:\\' : '/');
    let f = filter.trim() || '*';
    if (!f.includes('*') && !f.includes('?')) f = `*${f}*`;

    let cmd: string;
    if (os === 'nix') {
      cmd = `find ${shQuote(p)} -type ${type === 'file' ? 'f' : 'd'} -iname ${shQuote(f)} 2>/dev/null`;
    } else {
      const typeFlag = type === 'file' ? '-File' : '-Directory';
      cmd = `Get-ChildItem -Path ${psQuote(p)} ${typeFlag} -Force -Recurse -Filter ${psQuote(f)} -ErrorAction SilentlyContinue`;
    }
    setOut(cmd);
  };

  return (
    <>
      <div className="field-row">
        <div>
          <label htmlFor="fcPath">Path</label>
          <input id="fcPath" type="text" placeholder="C:\Users or /home" value={path} onChange={(e) => setPath(e.target.value)} />
        </div>
        <div>
          <label htmlFor="fcFilter">Filter (name pattern)</label>
          <input id="fcFilter" type="text" placeholder="*.exe or config.*" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label>Type</label>
          <div className="radio-row">
            <label><input type="radio" checked={type === 'file'} onChange={() => setType('file')} /> File</label>
            <label><input type="radio" checked={type === 'dir'} onChange={() => setType('dir')} /> Directory</label>
          </div>
        </div>
        <div>
          <label>OS</label>
          <div className="radio-row">
            <label><input type="radio" checked={os === 'nix'} onChange={() => setOs('nix')} /> *nix</label>
            <label><input type="radio" checked={os === 'win'} onChange={() => setOs('win')} /> Windows</label>
          </div>
        </div>
      </div>
      <div className="btn-row">
        <button className="primary" onClick={generate}>Generate command</button>
        <button className="small" onClick={() => copy(out)}>Copy result</button>
      </div>
      <div className="result-box">{out}</div>
      <div className="hint">Only one filter at a time is supported, matching a single name pattern. If you don't include a wildcard, one is added around your filter automatically.</div>
    </>
  );
}
