import { useState } from 'react';
import { StatsPanel } from './components/StatsPanel';
import { LeadsTable } from './components/LeadsTable';
import { AiSummaryPanel } from './components/AiSummaryPanel';
import { NewLeadModal } from './components/NewLeadModal';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[--color-ink] text-[--color-paper]">
      <Header onNewLead={() => setModalOpen(true)} />

      <main className="max-w-[1280px] mx-auto px-6 py-10 space-y-10">
        {/* Editorial intro */}
        <section className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12 pb-6 border-b border-[--color-line-strong]">
          <div className="flex-1">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-[--color-amber] mb-3">
              Million Copy · Leads dashboard
            </p>
            <h1 className="display text-5xl md:text-6xl leading-[0.95] tracking-tight">
              Your funnel, <br />
              <span className="display-italic text-[--color-amber]">in plain English.</span>
            </h1>
          </div>
          <p className="text-sm text-[--color-paper]/65 leading-relaxed md:max-w-sm">
            Register inbound leads, slice them by channel and date, and ask the
            LLM for an executive briefing the moment something feels off.
          </p>
        </section>

        <StatsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[--color-line-strong]">
          <div className="lg:col-span-2">
            <LeadsTable />
          </div>
          <div>
            <AiSummaryPanel />
          </div>
        </div>
      </main>

      <Footer />
      <NewLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function Header({ onNewLead }: { onNewLead: () => void }) {
  return (
    <header className="border-b border-[--color-line-strong] bg-[--color-ink]/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[--color-amber] grid place-items-center">
            <span className="display text-[--color-ink] text-lg leading-none">M</span>
          </div>
          <div className="leading-tight">
            <p className="display text-base">Million Copy</p>
            <p className="mono text-[9px] uppercase tracking-[0.22em] text-[--color-paper]/55">
              Leads · v1.0
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="mono text-[11px] uppercase tracking-[0.18em] px-3 py-2 text-[--color-paper]/65 hover:text-[--color-paper]"
          >
            API docs ↗
          </a>
          <button
            onClick={onNewLead}
            className="mono text-[11px] uppercase tracking-[0.18em] px-4 py-2 bg-[--color-amber] text-[--color-ink] hover:opacity-90"
          >
            + New lead
          </button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[--color-line-strong] mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/55">
          Built with NestJS · Postgres · React · Tailwind v4
        </p>
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-[--color-paper]/35">
          Million Copy · 2026
        </p>
      </div>
    </footer>
  );
}
