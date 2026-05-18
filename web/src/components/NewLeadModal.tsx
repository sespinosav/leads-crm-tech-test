import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, CreateLeadInput, LEAD_SOURCES, LeadSource } from '../lib/api';
import { sourceLabels } from './SourceBadge';

interface Props {
  open: boolean;
  onClose: () => void;
}

const empty: CreateLeadInput = {
  nombre: '',
  email: '',
  telefono: '',
  fuente: 'instagram',
  productoInteres: '',
  presupuesto: undefined,
};

export function NewLeadModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateLeadInput>(empty);

  const create = useMutation({
    mutationFn: (input: CreateLeadInput) => api.createLead(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setForm(empty);
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[--color-ink-2] border border-[--color-line-strong]"
      >
        <header className="p-6 border-b border-[--color-line-strong] flex items-center justify-between">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55">
              New entry
            </p>
            <h2 className="display text-3xl tracking-tight mt-1">Register a lead</h2>
          </div>
          <button
            onClick={onClose}
            className="mono text-[11px] uppercase tracking-[0.18em] text-[--color-paper]/55 hover:text-[--color-paper]"
          >
            Close ✕
          </button>
        </header>

        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const clean: CreateLeadInput = {
              nombre: form.nombre.trim(),
              email: form.email.trim(),
              fuente: form.fuente,
              telefono: form.telefono?.trim() || undefined,
              productoInteres: form.productoInteres?.trim() || undefined,
              presupuesto:
                form.presupuesto === undefined || Number.isNaN(form.presupuesto)
                  ? undefined
                  : Number(form.presupuesto),
            };
            create.mutate(clean);
          }}
        >
          <Field label="Name *">
            <Input
              required
              minLength={2}
              value={form.nombre}
              onChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
              placeholder="Laura Gómez"
            />
          </Field>
          <Field label="Email *">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="laura@example.com"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input
                value={form.telefono ?? ''}
                onChange={(v) => setForm((f) => ({ ...f, telefono: v }))}
                placeholder="+57 300 ..."
              />
            </Field>
            <Field label="Source *">
              <select
                required
                value={form.fuente}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fuente: e.target.value as LeadSource }))
                }
                className="w-full bg-[--color-ink] border border-[--color-line-strong] px-3 py-2.5 text-sm text-[--color-paper] focus:outline-none focus:border-[--color-amber]"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s} className="bg-[--color-ink-2]">
                    {sourceLabels[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Product of interest">
            <Input
              value={form.productoInteres ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, productoInteres: v }))}
              placeholder="Curso de copywriting"
            />
          </Field>
          <Field label="Budget (USD)">
            <Input
              type="number"
              value={form.presupuesto?.toString() ?? ''}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  presupuesto: v === '' ? undefined : Number(v),
                }))
              }
              placeholder="500"
            />
          </Field>

          {create.error && (
            <p className="text-sm text-[--color-danger] border border-[--color-danger]/30 p-3 bg-[--color-danger]/10">
              {(create.error as Error).message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="mono text-[11px] uppercase tracking-[0.18em] px-4 py-2.5 border border-[--color-line-strong] hover:bg-[--color-ink]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="mono text-[11px] uppercase tracking-[0.18em] px-4 py-2.5 bg-[--color-amber] text-[--color-ink] hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? 'Saving…' : 'Save lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55 block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
function Input({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[--color-ink] border border-[--color-line-strong] px-3 py-2.5 text-sm text-[--color-paper] placeholder:text-[--color-paper]/30 focus:outline-none focus:border-[--color-amber]"
    />
  );
}
