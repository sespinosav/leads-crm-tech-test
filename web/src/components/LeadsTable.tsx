import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, LEAD_SOURCES, LeadSource } from '../lib/api';
import { SourceBadge, sourceLabels } from './SourceBadge';

interface Filters {
  fuente?: LeadSource;
  from?: string;
  to?: string;
}

export function LeadsTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['leads', page, filters],
    queryFn: () => api.listLeads({ page, limit: 10, ...filters }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.deleteLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return (
    <div className="bg-[--color-ink-2] border border-[--color-line-strong]">
      <div className="flex items-center justify-between p-5 border-b border-[--color-line-strong] gap-4 flex-wrap">
        <div>
          <h2 className="display text-2xl tracking-tight">Leads</h2>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-[--color-paper]/55 mt-1">
            {data ? `${data.meta.total} total` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={filters.fuente ?? ''}
            onChange={(v) =>
              setFilters((f) => ({ ...f, fuente: (v || undefined) as LeadSource | undefined }))
            }
            options={[
              { value: '', label: 'All sources' },
              ...LEAD_SOURCES.map((s) => ({ value: s, label: sourceLabels[s] })),
            ]}
          />
          <DateInput
            value={filters.from ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, from: v || undefined }))}
            placeholder="From"
          />
          <DateInput
            value={filters.to ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, to: v || undefined }))}
            placeholder="To"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[--color-paper]/55 border-b border-[--color-line-strong]">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Source</Th>
              <Th className="text-right">Budget</Th>
              <Th>Created</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[--color-paper]/55">
                  Loading…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[--color-danger]">
                  {(error as Error).message}
                </td>
              </tr>
            )}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[--color-paper]/55">
                  No leads match these filters.
                </td>
              </tr>
            )}
            {data?.data.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-[--color-line] hover:bg-[--color-ink] transition-colors"
              >
                <Td>
                  <span className="text-[--color-paper]">{lead.nombre}</span>
                  {lead.productoInteres && (
                    <p className="text-[11px] text-[--color-paper]/45 mt-0.5">
                      {lead.productoInteres}
                    </p>
                  )}
                </Td>
                <Td>
                  <span className="mono text-xs text-[--color-paper]/80">{lead.email}</span>
                </Td>
                <Td>
                  <SourceBadge source={lead.fuente} />
                </Td>
                <Td className="text-right mono text-xs">
                  {lead.presupuesto === null
                    ? <span className="text-[--color-paper]/35">—</span>
                    : `$${Number(lead.presupuesto).toLocaleString('en-US')}`}
                </Td>
                <Td>
                  <span className="mono text-[11px] text-[--color-paper]/55">
                    {new Date(lead.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Delete lead "${lead.nombre}"?`))
                        removeMutation.mutate(lead.id);
                    }}
                    className="text-[11px] mono uppercase tracking-[0.18em] text-[--color-paper]/45 hover:text-[--color-danger] transition-colors"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-[--color-line-strong]">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-[--color-paper]/55">
          {data ? `Page ${data.meta.page} of ${data.meta.totalPages}` : '—'}
          {isFetching && ' · refreshing…'}
        </span>
        <div className="flex gap-2">
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </PageBtn>
          <PageBtn
            disabled={!data || page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </PageBtn>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        'mono text-[10px] uppercase tracking-[0.18em] font-normal px-5 py-3 ' + className
      }
    >
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={'px-5 py-4 align-top ' + className}>{children}</td>;
}
function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="mono text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 border border-[--color-line-strong] hover:bg-[--color-ink] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mono text-[11px] uppercase tracking-[0.14em] bg-[--color-ink] border border-[--color-line-strong] px-3 py-2 text-[--color-paper] focus:outline-none focus:border-[--color-amber]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[--color-ink-2]">
          {o.label}
        </option>
      ))}
    </select>
  );
}
function DateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mono text-[11px] uppercase bg-[--color-ink] border border-[--color-line-strong] px-3 py-2 text-[--color-paper]/80 focus:outline-none focus:border-[--color-amber]"
    />
  );
}
