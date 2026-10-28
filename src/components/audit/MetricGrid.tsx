import { ArrowDownRight, ArrowUpRight, IndianRupee, ShieldCheck, Siren, Truck } from 'lucide-react';
import { useChainGuard } from '@/store/useChainGuard';
import { computeMetrics } from '@/lib/metrics';
import { cn, inr, num } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

export function MetricGrid() {
  const dispatches = useChainGuard((state) => state.dispatches);
  const metrics = computeMetrics(dispatches);

  const cards = [
    {
      label: 'Total active dispatches',
      value: num(metrics.activeDispatches),
      icon: Truck,
      accent: 'text-slate-200',
      ring: 'ring-white/[0.06]',
      glow: 'from-slate-400/10',
      footer: (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="font-mono font-semibold text-emerald-300">{metrics.sealedEnRoute}</span> sealed en route
          <span className="text-slate-700">·</span>
          <span className="font-mono font-semibold text-amber-300">{metrics.awaitingReturn}</span> awaiting return
        </div>
      ),
      tooltip: 'Manifests currently sealed in transit or awaiting warehouse reconciliation.',
    },
    {
      label: 'Sealed en-route count',
      value: num(metrics.sealedEnRoute),
      icon: ShieldCheck,
      accent: 'text-emerald-300',
      ring: 'ring-emerald-500/20',
      glow: 'from-emerald-400/10',
      footer: (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            {metrics.unitsInTransit.toLocaleString('en-IN')} units
          </span>
          under live custody
        </div>
      ),
      tooltip: 'Core + buffer inventory under an intact seal right now.',
    },
    {
      label: 'Fraud / tamper alerts',
      value: num(metrics.fraudAlerts),
      icon: Siren,
      accent: metrics.fraudAlerts > 0 ? 'text-rose-400' : 'text-slate-200',
      ring: metrics.fraudAlerts > 0 ? 'ring-rose-500/30' : 'ring-white/[0.06]',
      glow: metrics.fraudAlerts > 0 ? 'from-rose-500/15' : 'from-slate-400/10',
      footer:
        metrics.fraudAlerts > 0 ? (
          <div className="flex items-center gap-1.5 text-[10px] text-rose-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-rose-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
            </span>
            Settlement payouts locked
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ArrowDownRight className="h-3 w-3 text-emerald-400" />
            No unresolved tamper events
          </div>
        ),
      tooltip: 'Manifests where warehouse return count failed the mandatory buffer reconciliation.',
    },
    {
      label: 'Financial loss saved',
      value: inr(metrics.lossSaved),
      icon: IndianRupee,
      accent: 'text-cyan-300',
      ring: 'ring-cyan-500/20',
      glow: 'from-cyan-400/10',
      footer: (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="font-mono font-semibold text-cyan-300">{metrics.complianceRate}%</span> clean reconciliation
          rate
        </div>
      ),
      tooltip: 'Buffer units secured at check-in + shortages intercepted × ₹1,200 declared unit value.',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/50 p-4 shadow-panel ring-1 ring-inset backdrop-blur-sm transition-colors hover:border-white/10 sm:p-5',
            card.ring,
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-60',
              card.glow,
            )}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {card.label}
              <Tooltip label={card.tooltip} />
            </div>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]',
                card.accent,
              )}
            >
              <card.icon className="h-4 w-4" />
            </span>
          </div>
          <div className={cn('relative mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums', card.accent)}>
            {card.value}
          </div>
          <div className="relative mt-3 flex items-center justify-between gap-2">{card.footer}</div>
          <div className="pointer-events-none absolute -bottom-6 -right-4 opacity-[0.04]">
            <card.icon className="h-24 w-24" />
          </div>
        </div>
      ))}
      {metrics.fraudAlerts > 0 ? (
        <div className="sr-only" role="status">
          {metrics.fraudAlerts} fraud alerts require review
        </div>
      ) : null}
    </div>
  );
}
