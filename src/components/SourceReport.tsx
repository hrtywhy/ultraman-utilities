import React, { useState } from 'react';
import type { SourceResult } from '../lib/api';

export type Source = {
  id: string;
  label: string;
  run: (target: string) => Promise<SourceResult>;
};

type RowState = { status: 'idle' | 'loading' | 'ok' | 'err'; text: string; href?: string; linkLabel?: string };

export function useSourceReport(sources: Source[]) {
  const [rows, setRows] = useState<Record<string, RowState>>(
    Object.fromEntries(sources.map((s) => [s.id, { status: 'idle', text: '—' }]))
  );

  const run = async (target: string) => {
    setRows(Object.fromEntries(sources.map((s) => [s.id, { status: 'loading', text: '' }])));
    sources.forEach((s) => {
      s.run(target)
        .then((result) => {
          const row: RowState =
            typeof result === 'string'
              ? { status: 'ok', text: result }
              : { status: 'ok', text: result.text, href: result.href, linkLabel: result.linkLabel };
          setRows((prev) => ({ ...prev, [s.id]: row }));
        })
        .catch((e: Error) => setRows((prev) => ({ ...prev, [s.id]: { status: 'err', text: e.message } })));
    });
  };

  return { rows, run };
}

// Serialize the current report to "Label: value" lines for the Copy button.
export function reportToText(sources: Source[], rows: Record<string, RowState>) {
  return sources
    .map((s) => {
      const r = rows[s.id];
      const val = r?.status === 'loading' ? 'checking…' : r?.text ?? '—';
      const link = r?.href ? ` ${r.href}` : '';
      return `${s.label}: ${val}${link}`;
    })
    .join('\n');
}

// Is there any finished data worth copying yet?
export function reportHasData(rows: Record<string, RowState>) {
  return Object.values(rows).some((r) => r.status === 'ok' || r.status === 'err');
}

// Verdict coloring: flag clearly-bad results red and clearly-clean ones green,
// leave everything else neutral.
function verdictClass(state: RowState) {
  if (state.status === 'err') return ' bad';
  if (state.status !== 'ok') return '';
  if (/malicious|anonymizer detected|blacklist count\s*:\s*[1-9]|risk:\s*(high|critical)|confidence [5-9]\d%|confidence 100%/i.test(state.text)) return ' bad';
  if (/^clean|classification: (whitelist|neutral)|risk: (none|low)|^0 pulse|not in .* database/i.test(state.text)) return ' good';
  return '';
}

export function SourceReportRow({ label, state }: { label: string; state: RowState }) {
  const verdict = verdictClass(state);
  return (
    <div className="ip-row">
      <span className={'ip-row-dot' + (state.status === 'ok' ? verdict || ' neutral' : state.status === 'err' ? ' bad' : '')} />
      <div className="ip-row-label">{label}</div>
      <div className={'ip-row-value' + verdict + (state.status === 'loading' || state.status === 'idle' ? ' muted' : '')}>
        {state.status === 'loading' ? (
          <span className="status-line"><span className="spinner" />Checking…</span>
        ) : (
          <>
            {state.text}
            {state.href && (
              <a className="ip-row-link" href={state.href} target="_blank" rel="noreferrer">
                {state.linkLabel || 'Open ↗'}
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
