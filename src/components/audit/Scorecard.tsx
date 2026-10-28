import { BadgeCheck, ShieldQuestion, TrendingDown, Users } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, TrustBadge, TrustMeter } from '@/components/ui/Badges';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChainGuard } from '@/store/useChainGuard';
import { DRIVER_ROSTER } from '@/lib/constants';
import { buildScorecard } from '@/lib/metrics';
import { cn } from '@/lib/utils';

export function Scorecard() {
  const dispatches = useChainGuard((state) => state.dispatches);
  const roster = DRIVER_ROSTER.map((driver) => driver.name);
  const scores = buildScorecard(dispatches, roster);
  const atRisk = scores.filter((score) => score.rating === 'Flagged' || score.rating === 'Watchlist').length;

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader
        title="Driver reliability & integrity scorecard"
        subtitle="Rolling custody performance across every sealed manifest."
        icon={<Users className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={atRisk > 0 ? 'red' : 'emerald'} dot pulse={atRisk > 0}>
              {atRisk} at risk
            </Badge>
            <Badge tone="slate">
              <BadgeCheck className="h-2.5 w-2.5" />
              {scores.length} drivers
            </Badge>
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <th className="px-5 py-3">Driver</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3 text-center">Runs</th>
              <th className="px-4 py-3 text-center">Incidents</th>
              <th className="px-4 py-3 text-center">Route exceptions</th>
              <th className="px-4 py-3 text-center">Missing units</th>
              <th className="px-4 py-3">Trust score</th>
              <th className="px-5 py-3 text-right">Standing</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => {
              const elevated = score.rating === 'Flagged' || score.rating === 'Watchlist';
              return (
                <tr
                  key={score.name}
                  className={cn(
                    'border-t border-white/[0.05] text-xs transition-colors hover:bg-white/[0.02]',
                    elevated && 'bg-rose-500/[0.025]',
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold ring-1 ring-inset',
                          elevated
                            ? 'bg-rose-500/10 text-rose-300 ring-rose-500/25'
                            : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
                        )}
                      >
                        {score.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-200">{score.name}</div>
                        <div className="mt-0.5 text-[9px] text-slate-500">
                          {score.runs} sealed run{score.runs === 1 ? '' : 's'} · {score.deliveries} verified
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                    {score.vehicles.length > 0 ? score.vehicles.join(' · ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-300">{score.runs}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'font-mono text-[11px]',
                        score.incidents > 0 ? 'font-semibold text-amber-300' : 'text-slate-500',
                      )}
                    >
                      {score.incidents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'font-mono text-[11px]',
                        score.deviations > 0 ? 'font-semibold text-amber-300' : 'text-slate-500',
                      )}
                    >
                      {score.deviations}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'font-mono text-[11px]',
                        score.shortages > 0 ? 'font-bold text-rose-400' : 'text-slate-500',
                      )}
                    >
                      {score.shortages}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TrustMeter score={score.trustScore} />
                      {score.shortages > 0 ? <TrendingDown className="h-3 w-3 text-rose-400" /> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {score.rating === 'Flagged' ? <ShieldQuestion className="h-3.5 w-3.5 text-rose-400" /> : null}
                      <TrustBadge rating={score.rating} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-black/20 px-5 py-3 text-[9px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          Trust score = 100 − 22 × missing units − 4 × incidents − 3 × route exceptions
          <Tooltip label="Scores are recomputed live from the sealed dispatch ledger. A single missing buffer unit costs 22 points — stronger than an incident, because it implies intent." />
        </span>
        <span className="font-mono uppercase tracking-wider">Floor 0 · ceiling 100</span>
      </div>
    </Card>
  );
}
