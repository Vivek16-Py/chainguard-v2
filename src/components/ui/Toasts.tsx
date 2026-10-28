import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useChainGuard } from '@/store/useChainGuard';
import { cn } from '@/lib/utils';

const tones = {
  success: {
    ring: 'ring-emerald-500/30',
    icon: 'text-emerald-400',
    bar: 'bg-emerald-400',
    Icon: CheckCircle2,
  },
  danger: {
    ring: 'ring-rose-500/40',
    icon: 'text-rose-400',
    bar: 'bg-rose-500',
    Icon: XCircle,
  },
  warning: {
    ring: 'ring-amber-400/35',
    icon: 'text-amber-300',
    bar: 'bg-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    ring: 'ring-cyan-500/30',
    icon: 'text-cyan-300',
    bar: 'bg-cyan-400',
    Icon: Info,
  },
} as const;

export function Toasts() {
  const toasts = useChainGuard((state) => state.toasts);
  const dismissToast = useChainGuard((state) => state.dismissToast);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-5 right-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5 sm:right-6"
    >
      {toasts.map((toast) => {
        const tone = tones[toast.tone];
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto relative overflow-hidden rounded-xl bg-slate-900/95 p-3.5 pr-9 shadow-2xl ring-1 backdrop-blur animate-slide-up',
              tone.ring,
            )}
          >
            <div className="flex items-start gap-2.5">
              <tone.Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.icon)} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-100">{toast.title}</p>
                {toast.message ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{toast.message}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className={cn('absolute bottom-0 left-0 h-0.5 w-full opacity-60', tone.bar)} />
          </div>
        );
      })}
    </div>
  );
}
