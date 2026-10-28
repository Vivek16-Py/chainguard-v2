import { CalendarDays, ShieldCheck } from 'lucide-react';
import { useChainGuard } from '@/store/useChainGuard';

export function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-emerald-500/[0.09] blur-[120px]" />
      <div className="absolute -right-40 top-16 h-[30rem] w-[30rem] rounded-full bg-rose-500/[0.06] blur-[130px]" />
      <div className="absolute bottom-0 left-1/3 h-[26rem] w-[40rem] rounded-full bg-cyan-500/[0.04] blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 20%, transparent 75%)',
        }}
      />
    </div>
  );
}

export function Footer() {
  const resetDemo = useChainGuard((state) => state.resetDemo);

  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 px-4 py-6 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1.5 font-semibold tracking-tight text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            ChainGuard v2
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span>Seal protocol v2.4 · client-side demo environment</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All services nominal
          </span>
          <button
            type="button"
            onClick={resetDemo}
            className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 font-medium text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-300"
          >
            Reset demo data
          </button>
        </div>
      </div>
    </footer>
  );
}
