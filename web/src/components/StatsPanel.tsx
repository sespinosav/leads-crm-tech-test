import { useQuery } from '@tanstack/react-query';
import { api, LeadSource } from '../lib/api';
import { sourceLabels } from './SourceBadge';

export function StatsPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.stats(),
  });

  if (isLoading) return <Skeleton />;
  if (error)
    return (
      <Card>
        <p className="text-[--color-danger] text-sm">
          Failed to load stats: {(error as Error).message}
        </p>
      </Card>
    );
  if (!data) return null;

  const total = data.total || 1;
  const sorted = (Object.entries(data.bySource) as [LeadSource, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[--color-line-strong] border border-[--color-line-strong]">
      <Cell label="Total leads" value={data.total.toString()} />
      <Cell
        label="Last 7 days"
        value={data.lastSevenDays.toString()}
        accent
      />
      <Cell
        label="Avg. budget"
        value={
          data.averageBudget === null
            ? '—'
            : `USD ${data.averageBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        }
      />
      <div className="bg-[--color-ink-2] p-6">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55 mb-3">
          By source
        </p>
        <div className="space-y-2">
          {sorted.map(([src, count]) => {
            const pct = data.total === 0 ? 0 : (count / total) * 100;
            return (
              <div key={src}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[--color-paper]/85">{sourceLabels[src]}</span>
                  <span className="mono text-[--color-paper]/60">
                    {count} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-[3px] bg-[--color-line]">
                  <div
                    className="h-full bg-[--color-amber]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[--color-ink-2] p-6 flex flex-col justify-between min-h-[150px]">
      <p className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55">
        {label}
      </p>
      <p
        className={
          'display text-5xl leading-none tracking-tight ' +
          (accent ? 'text-[--color-amber]' : 'text-[--color-paper]')
        }
      >
        {value}
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[--color-ink-2] border border-[--color-line-strong] p-6">
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[--color-line-strong] border border-[--color-line-strong]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[--color-ink-2] p-6 min-h-[150px] animate-pulse"
        >
          <div className="h-3 w-20 bg-[--color-line] mb-6" />
          <div className="h-8 w-24 bg-[--color-line]" />
        </div>
      ))}
    </div>
  );
}
