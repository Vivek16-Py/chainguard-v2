import { Activity, AlertTriangle, MapPin, Radio, Route, ShieldAlert, Siren } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badges';
import { useChainGuard } from '@/store/useChainGuard';
import { INCIDENT_META } from '@/lib/constants';
import { exceptionFeed } from '@/lib/metrics';
import { cn, formatTime, timeAgo } from '@/lib/utils';

export function ExceptionFeed() {
  const dispatches = useChainGuard((state) => state.dispatches);
  const items = exceptionFeed(dispatches).slice(0, 8);
  const incidentCount = dispatches.reduce((total, dispatch) => total + dispatch.incidents.length, 0);
  const onRoute = dispatches.filter((dispatch) => dispatch.telemetry.routeStatus === 'ON_ROUTE').length;
  const deviations = dispatches.filter((dispatch) => dispatch.telemetry.routeStatus === 'DEVIATED').length;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader
        title="Exception & incident feed"
        subtitle="GPS-anchored events raised across the live fleet."
        icon={<Siren className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={items.length > 0 ? 'red' : 'slate'} dot pulse={items.length > 0}>
              {items.length}
            </Badge>
          </div>
        }
      />

      <div className="flex-1 divide-y divide-white/[0.05] overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/50 text-emerald-400 ring-1 ring-inset ring-white/[0.06]">
              <Activity className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-xs font-semibold text-slate-200">No open exceptions</h3>
            <p className="mt-1 max-w-[240px] text-[10px] leading-relaxed text-slate-500">
              Every manifest is moving cleanly. Incidents and shrinkage flags will surface here instantly.
            </p>
          </div>
        ) : (
          items.map((item, index) => {
            const fraud = item.kind === 'fraud';
            const meta = fraud
              ? {
                  title: 'Critical shrinkage · settlement locked',
                  copy: `${item.dispatch.returnRecord!.shortage} buffer unit(s) unaccounted at warehouse check-in.`,
                  tone: 'rose' as const,
                  at: item.at,
                }
              : {
                  title: `${INCIDENT_META[item.incident.type].short} reported`,
                  copy: item.incident.note || INCIDENT_META[item.incident.type].description,
                  tone: item.incident.type === 'BREAKDOWN' ? ('rose' as const) : ('amber' as const),
                  at: item.at,
                };

            return (
              <div key={`${item.dispatch.id}-${index}`} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                    meta.tone === 'rose'
                      ? 'bg-rose-500/10 text-rose-400 ring-rose-500/25'
                      : 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
                  )}
                >
                  {fraud ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold leading-snug text-slate-200">{meta.title}</span>
                    <span className="shrink-0 font-mono text-[9px] text-slate-600">{timeAgo(meta.at)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{meta.copy}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[9px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Radio className="h-2.5 w-2.5" />
                      {item.dispatch.id}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Route className="h-2.5 w-2.5" />
                      {item.dispatch.driverName}
                    </span>
                    {fraud ? (
                      <span className="inline-flex items-center gap-1 text-rose-400/80">
                        <MapPin className="h-2.5 w-2.5" />
                        Warehouse · {formatTime(meta.at)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {item.incident.gps}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] bg-black/20">
        {[
          { label: 'On route', value: onRoute, tone: 'text-emerald-300' },
          { label: 'Deviations', value: deviations, tone: 'text-amber-300' },
          { label: 'Incidents', value: incidentCount, tone: 'text-rose-300' },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-2.5 text-center">
            <div className={cn('font-mono text-base font-bold tabular-nums', stat.tone)}>{stat.value}</div>
            <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
