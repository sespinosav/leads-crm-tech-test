export type LeadSource =
  | 'instagram'
  | 'facebook'
  | 'landing_page'
  | 'referido'
  | 'otro';

export const LEAD_SOURCES: LeadSource[] = [
  'instagram',
  'facebook',
  'landing_page',
  'referido',
  'otro',
];

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  fuente: LeadSource;
  productoInteres: string | null;
  presupuesto: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedLeads {
  data: Lead[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Stats {
  total: number;
  bySource: Record<LeadSource, number>;
  averageBudget: number | null;
  lastSevenDays: number;
}

export interface AiSummaryResponse {
  provider: string;
  filter: Record<string, unknown>;
  leadsAnalyzed: number;
  generatedAt: string;
  summary: string;
}

export interface CreateLeadInput {
  nombre: string;
  email: string;
  telefono?: string;
  fuente: LeadSource;
  productoInteres?: string;
  presupuesto?: number;
}

// All requests go through Vite's proxy in dev. In production set
// VITE_API_BASE to the deployed API origin.
const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.message)
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listLeads: (params: {
    page?: number;
    limit?: number;
    fuente?: LeadSource;
    from?: string;
    to?: string;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') q.set(k, String(v));
    });
    return request<PaginatedLeads>(`/leads?${q.toString()}`);
  },
  stats: () => request<Stats>('/leads/stats'),
  createLead: (input: CreateLeadInput) =>
    request<Lead>('/leads', { method: 'POST', body: JSON.stringify(input) }),
  deleteLead: (id: string) =>
    request<{ deleted: true; id: string }>(`/leads/${id}`, { method: 'DELETE' }),
  summary: (filter: { fuente?: LeadSource; from?: string; to?: string }) =>
    request<AiSummaryResponse>('/leads/ai/summary', {
      method: 'POST',
      body: JSON.stringify(filter),
    }),
};
