import React, { useState } from 'react';

export type Source = {
  id: string;
  label: string;
  run: (target: string) => Promise<string>;
};

type RowState = { status: 'idle' | 'loading' | 'ok' | 'err'; text: string };

export function useSourceReport(sources: Source[]) {
  const [rows, setRows] = useState<Record<string, RowState>>(
    Object.fromEntries(sources.map((s) => [s.id, { status: 'idle', text: '—' }]))
  );

  const run = async (target: string) => {
    setRows(Object.fromEntries(sources.map((s) => [s.id, { status: 'loading', text: '' }])));
    sources.forEach((s) => {
      s.run(target)
        .then((text) => setRows((prev) => ({ ...prev, [s.id]: { status: 'ok', text } })))
        .catch((e: Error) => setRows((prev) => ({ ...prev, [s.id]: { status: 'err', text: e.message } })));
    });
  };

  return { rows, run };
}

export function SourceReportRow({ label, state }: { label: string; state: RowState }) {
  return (
    <div className="ip-row">
      <div className="ip-row-label">{label}</div>
      <div className={'ip-row-value' + (state.status === 'loading' || state.status === 'err' || state.status === 'idle' ? ' muted' : '')}>
        {state.status === 'loading' ? (
          <span className="status-line"><span className="spinner" />Checking…</span>
        ) : (
          state.text
        )}
      </div>
    </div>
  );
}
