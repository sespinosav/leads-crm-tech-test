/**
 * Allowed marketing channels for a lead. Centralised here so DTOs, the
 * database entity, the seed and the AI prompt all share the same source of
 * truth.
 */
export const LEAD_SOURCES = [
  'instagram',
  'facebook',
  'landing_page',
  'referido',
  'otro',
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
