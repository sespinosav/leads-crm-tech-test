import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api, LEAD_SOURCES, LeadSource } from '../lib/api';
import { sourceLabels } from './SourceBadge';

export function AiSummaryPanel() {
  const [fuente, setFuente] = useState<LeadSource | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const summary = useMutation({
    mutationFn: () =>
      api.summary({
        fuente: fuente || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  return (
    <div className="bg-[--color-ink-2] border border-[--color-line-strong]">
      <header className="p-5 border-b border-[--color-line-strong]">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-amber]">
          AI executive summary
        </p>
        <h2 className="display-italic text-3xl mt-1 leading-tight">
          What is this <span className="text-[--color-amber]">funnel</span> telling you?
        </h2>
        <p className="text-sm text-[--color-paper]/55 mt-2 leading-relaxed">
          Filter the dataset, ask the model and it returns a markdown briefing
          with the dominant channel and three recommendations.
        </p>
      </header>

      <div className="p-5 space-y-3 border-b border-[--color-line-strong]">
        <label className="block">
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55 block mb-1.5">
            Source
          </span>
          <select
            value={fuente}
            onChange={(e) => setFuente(e.target.value as LeadSource | '')}
            className="w-full bg-[--color-ink] border border-[--color-line-strong] px-3 py-2 text-sm focus:outline-none focus:border-[--color-amber]"
          >
            <option value="" className="bg-[--color-ink-2]">All channels</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s} className="bg-[--color-ink-2]">
                {sourceLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55 block mb-1.5">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-[--color-ink] border border-[--color-line-strong] px-3 py-2 text-sm focus:outline-none focus:border-[--color-amber]"
            />
          </label>
          <label className="block">
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55 block mb-1.5">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-[--color-ink] border border-[--color-line-strong] px-3 py-2 text-sm focus:outline-none focus:border-[--color-amber]"
            />
          </label>
        </div>
        <button
          onClick={() => summary.mutate()}
          disabled={summary.isPending}
          className="w-full mono text-[11px] uppercase tracking-[0.22em] px-4 py-3 bg-[--color-amber] text-[--color-ink] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {summary.isPending ? 'Thinking…' : 'Generate summary →'}
        </button>
      </div>

      <div className="p-5 min-h-[200px]">
        {summary.isIdle && (
          <p className="text-sm text-[--color-paper]/45 leading-relaxed">
            Pick filters above and run a summary. Without an{' '}
            <span className="mono text-[--color-amber]">OPENAI_API_KEY</span>{' '}
            the backend serves a deterministic mock — same shape, no cost.
          </p>
        )}
        {summary.isPending && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-1/2 bg-[--color-line]" />
            <div className="h-3 w-full bg-[--color-line]" />
            <div className="h-3 w-5/6 bg-[--color-line]" />
            <div className="h-3 w-3/4 bg-[--color-line]" />
          </div>
        )}
        {summary.error && (
          <p className="text-sm text-[--color-danger]">{(summary.error as Error).message}</p>
        )}
        {summary.data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mono text-[10px] uppercase tracking-[0.18em] text-[--color-paper]/55">
              <span>provider: {summary.data.provider}</span>
              <span>{summary.data.leadsAnalyzed} leads analyzed</span>
            </div>
            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-[--color-paper]/85 font-sans">
              {summary.data.summary}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
