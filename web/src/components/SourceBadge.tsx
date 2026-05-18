import { LEAD_SOURCES, LeadSource } from '../lib/api';

const labels: Record<LeadSource, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  landing_page: 'Landing',
  referido: 'Referido',
  otro: 'Otro',
};

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <span className="mono inline-flex items-center text-[10px] uppercase tracking-[0.18em] text-[--color-paper]/80 border border-[--color-line-strong] bg-[--color-ink-2] px-2 py-0.5">
      {labels[source]}
    </span>
  );
}

export { LEAD_SOURCES, labels as sourceLabels };
