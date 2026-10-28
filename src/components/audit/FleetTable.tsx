import { ArrowRight, CircleCheck, Lock, PackageSearch, Truck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, DispatchStatusBadge, RouteStatusBadge, SealBadge } from '@/components/ui/Badges';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { getRoute } from '@/lib/constants';
import { cn, num, timeAgo } from '@/lib/utils';
import type { Dispatch } from '@/types';

export function FleetTable({
  dispatches,
  onCheckIn,
}: {
  dispatches: Dispatch[];
  onCheckIn: (id: string) => void;
}) {
  const priority: Record<Dispatch['status'], number> = {
    EN_ROUTE_SEALED: 0,
    AWAITING_RETURN: 1,
    FRAUD_FLAGGED: 2,
    RECONCILED: 3,
  };
  const ordered = [...dispatches].sort((a, b) => priority[a.status] - priority[b.status]);

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader
        title="Live fleet & cargo manifest"
        subtitle="Core intact, unused buffer and damaged returns — reconciled per dispatch."
        icon={<PackageSearch className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-3 text-[9px] font-medium uppercase tracking-wider text-slate-600 lg:flex">
              <Legend color="bg-emerald-400/80" label="Core" />
              <Legend color="bg-cyan-400/70" label="Buffer" />
              <Legend color="bg-amber-400/80" label="Damaged" />
            </div>
            <Badge tone="slate">{dispatches.length} manifests</Badge>
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left">
          <thead>
            <tr className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <th className="sticky left-0 bg-slate-900/95 px-5 py-3 backdrop-blur">Dispatch</th>
              <th className="px-4 py-3">Driver / vehicle</th>
              <th className="px-4 py-3">Route status</th>
              <th className="px-4 py-3">Cargo state breakdown</th>
              <th className="px-4 py-3">Seal state</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((dispatch) => {
              const route = getRoute(dispatch.routeId);
              const core = dispatch.delivery?.intactReceived ?? dispatch.orderQty;
              const damaged = dispatch.returnRecord?.damagedReturned ?? dispatch.delivery?.damagedSwapped ?? 0;
              const unusedBuffer = dispatch.returnRecord
                ? dispatch.returnRecord.intactReturned
                : dispatch.bufferQty - (dispatch.delivery?.damagedSwapped ?? 0);
              const total = Math.max(1, core + unusedBuffer + damaged);
              const shortage = dispatch.returnRecord?.shortage ?? 0;
              const fraud = dispatch.status === 'FRAUD_FLAGGED';

              return (
                <tr
                  key={dispatch.id}
                  className={cn(
                    'group border-t border-white/[0.05] text-xs transition-colors hover:bg-white/[0.02]',
                    fraud && 'bg-rose-500/[0.035]',
                  )}
                >
                  <td className="sticky left-0 bg-slate-900/95 px-5 py-3.5 backdrop-blur transition-colors group-hover:bg-[#0b1220]">
                    <div className="font-mono text-[11px] font-semibold text-slate-200">{dispatch.id}</div>
                    <div className="mt-1">
                      <DispatchStatusBadge status={dispatch.status} />
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-slate-600">{timeAgo(dispatch.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] font-mono text-[9px] font-bold text-slate-400 ring-1 ring-inset ring-white/[0.06]">
                        {dispatch.driverName
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-slate-200">{dispatch.driverName}</div>
                        <div className="mt-0.5 font-mono text-[9px] text-slate-500">{dispatch.vehicleId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RouteStatusBadge status={dispatch.telemetry.routeStatus} />
                    <div className="mt-1.5 flex items-center gap-1 font-mono text-[9px] text-slate-500">
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      {route.code} · {route.distanceKm} km
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="w-44">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <Tooltip label={`Core intact: ${core} unit(s)`}>
                          <span
                            className="h-full bg-emerald-400/80 transition-all"
                            style={{ width: `${(core / total) * 100}%` }}
                          />
                        </Tooltip>
                        <Tooltip label={`Unused buffer: ${unusedBuffer} unit(s)`}>
                          <span
                            className="h-full bg-cyan-400/70 transition-all"
                            style={{ width: `${(unusedBuffer / total) * 100}%` }}
                          />
                        </Tooltip>
                        <Tooltip label={`Damaged returns: ${damaged} unit(s)`}>
                          <span
                            className="h-full bg-amber-400/80 transition-all"
                            style={{ width: `${(damaged / total) * 100}%` }}
                          />
                        </Tooltip>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[9px] text-slate-500">
                        <span className="text-emerald-300/90">
                          <span className="mr-1 inline-block h-1 w-1 rounded-full bg-emerald-400 align-middle" />
                          {core} core
                        </span>
                        <span className="text-cyan-300/90">
                          <span className="mr-1 inline-block h-1 w-1 rounded-full bg-cyan-400 align-middle" />
                          {unusedBuffer} buf
                        </span>
                        <span className="text-amber-300/90">
                          <span className="mr-1 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
                          {damaged} dmg
                        </span>
                        {shortage !== 0 ? (
                          <span className="font-semibold text-rose-400">
                            {shortage > 0 ? `−${shortage}` : `+${Math.abs(shortage)}`} variance
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <SealBadge state={dispatch.sealState} />
                    <div className="mt-1.5 font-mono text-[9px] text-slate-500">{dispatch.sealId}</div>
                    {dispatch.returnRecord?.payoutLocked ? (
                      <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-rose-400">
                        <Lock className="h-2.5 w-2.5" />
                        Payout locked
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {dispatch.status === 'AWAITING_RETURN' ? (
                      <Button size="sm" variant="secondary" onClick={() => onCheckIn(dispatch.id)}>
                        Check in
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : dispatch.status === 'FRAUD_FLAGGED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                        <Lock className="h-3 w-3" />
                        Settlement held
                      </span>
                    ) : dispatch.status === 'RECONCILED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400/80">
                        <CircleCheck className="h-3 w-3" />
                        Chain closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <Truck className="h-3 w-3" />
                        In transit
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {ordered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-xs text-slate-500">
                  No manifests yet. Generate a dispatch to populate the fleet table.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-black/20 px-5 py-3 text-[10px] text-slate-600">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live state · telemetry and reconciliations update instantly
        </div>
        <div className="font-mono">
          {num(ordered.reduce((sum, dispatch) => sum + dispatch.orderQty + dispatch.bufferQty, 0))} units under
          custody
        </div>
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
      {label}
    </span>
  );
}
