import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Gauge,
  Hand,
  MapPin,
  Navigation,
  Radio,
  Route as RouteIcon,
  Satellite,
  ShieldCheck,
  Siren,
  TrafficCone,
  Truck,
  UserRound,
  Wrench,
  ArrowLeftRight,
  Lock,
  PackageSearch,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Card';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, RouteStatusBadge, SealBadge } from '@/components/ui/Badges';
import { Select, Textarea } from '@/components/ui/Field';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChainGuard } from '@/store/useChainGuard';
import { INCIDENT_META, UNIT_VALUE_INR, getRoute } from '@/lib/constants';
import { cargoBreakdown, cn, formatTime, inr, jitterGps, num, timeAgo } from '@/lib/utils';
import { routeLabel } from '@/lib/metrics';
import type { IncidentType, RouteStatus } from '@/types';

const statusOptions: { value: RouteStatus; label: string; icon: typeof Navigation; copy: string }[] = [
  { value: 'ON_ROUTE', label: 'On Route', icon: Navigation, copy: 'Cleared corridor, no exceptions.' },
  { value: 'DEVIATED', label: 'Slightly Deviated', icon: AlertTriangle, copy: 'Off the pre-cleared route.' },
  { value: 'STOPPED', label: 'Stopped', icon: Hand, copy: 'Stationary, awaiting context.' },
];

const incidentIcons: Record<IncidentType, typeof Wrench> = {
  BREAKDOWN: Wrench,
  IMPACT: TrafficCone,
  BLOCKADE: Siren,
};

export function DriverPortal() {
  const dispatches = useChainGuard((state) => state.dispatches);
  const setRouteStatus = useChainGuard((state) => state.setRouteStatus);
  const advanceCheckpoint = useChainGuard((state) => state.advanceCheckpoint);
  const logIncident = useChainGuard((state) => state.logIncident);
  const setRole = useChainGuard((state) => state.setRole);

  const activeDispatches = useMemo(
    () => dispatches.filter((dispatch) => dispatch.status === 'EN_ROUTE_SEALED' || dispatch.status === 'AWAITING_RETURN'),
    [dispatches],
  );

  const [selectedId, setSelectedId] = useState<string>(activeDispatches[0]?.id ?? '');
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentNote, setIncidentNote] = useState('');

  const dispatch = activeDispatches.find((item) => item.id === selectedId) ?? activeDispatches[0];
  const dispatchId = dispatch?.id;

  useEffect(() => {
    if (!dispatchId && activeDispatches[0]) setSelectedId(activeDispatches[0].id);
  }, [activeDispatches, dispatchId]);

  useEffect(() => {
    if (!dispatchId) return;
    const timer = setInterval(() => {
      const state = useChainGuard.getState();
      const current = state.dispatches.find((item) => item.id === dispatchId);
      if (
        !current ||
        current.status !== 'EN_ROUTE_SEALED' ||
        current.telemetry.routeStatus !== 'ON_ROUTE'
      ) {
        return;
      }
      const route = getRoute(current.routeId);
      const nextCheckpoint =
        Math.random() > 0.68 && current.telemetry.checkpointIndex < route.checkpoints.length - 1
          ? current.telemetry.checkpointIndex + 1
          : current.telemetry.checkpointIndex;
      state.pingTelemetry(dispatchId, {
        speedKph: Math.round(26 + Math.random() * 30),
        gps: jitterGps(current),
        checkpointIndex: nextCheckpoint,
      });
    }, 3400);
    return () => clearInterval(timer);
  }, [dispatchId]);

  if (!dispatch) {
    return (
      <div>
        <PageHeader
          eyebrow="Driver telemetry & incident portal"
          title="No active manifest on this device."
          description="Sealed dispatches appear here the moment a vendor issues a digital seal. Generate a manifest in the vendor terminal to start telemetry."
          icon={<Truck className="h-3 w-3" />}
        />
        <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 ring-1 ring-inset ring-white/[0.06]">
            <Truck className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-slate-200">Awaiting dispatch assignment</h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            There are no sealed or return-leg manifests in the system right now.
          </p>
          <Button className="mt-5" onClick={() => setRole('vendor')}>
            Go to vendor terminal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  const route = getRoute(dispatch.routeId);
  const telemetry = dispatch.telemetry;
  const cargo = cargoBreakdown(dispatch);
  const onRoute = telemetry.routeStatus === 'ON_ROUTE';
  const sealed = dispatch.status === 'EN_ROUTE_SEALED';
  const progress =
    route.checkpoints.length > 1 ? (telemetry.checkpointIndex / (route.checkpoints.length - 1)) * 100 : 0;
  const speedPct = Math.min(1, telemetry.speedKph / 80);
  const circumference = 2 * Math.PI * 42;
  const gpsLock = telemetry.gps.split(', ');

  const currentCheckpoint = route.checkpoints[Math.min(telemetry.checkpointIndex, route.checkpoints.length - 1)];

  const submitIncident = () => {
    if (!incidentType) return;
    logIncident(dispatch.id, incidentType, incidentNote);
    setIncidentType(null);
    setIncidentNote('');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Driver telemetry & incident portal"
        title="Your route, your evidence trail."
        description="Live telemetry, checkpoint progress and one-tap incident beacons. Every unavoidable delay is timestamped and GPS-anchored before it becomes a dispute."
        icon={<Truck className="h-3 w-3" />}
        actions={
          <>
            <Badge tone="emerald" dot pulse className="h-9 px-3">
              Device paired
            </Badge>
            <Button variant="secondary" onClick={() => setRole('customer')}>
              <ShieldCheck className="h-4 w-4" />
              Customer handoff
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/25 to-cyan-500/10 font-mono text-xs font-bold text-emerald-200 ring-1 ring-inset ring-emerald-400/25">
            {dispatch.driverName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-100">{dispatch.driverName}</span>
              <span className="font-mono text-[10px] text-slate-500">{dispatch.vehicleId}</span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-500">
              {routeLabel(dispatch.routeId)} · {dispatch.id}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <Select
            aria-label="Select assigned dispatch"
            value={dispatch.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-9 py-0 text-xs"
          >
            {activeDispatches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.driverName} · {item.id} · {item.clientName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <Card className="overflow-hidden">
            <div className="relative border-b border-white/[0.06] px-5 py-5">
              <div className="pointer-events-none absolute inset-0 seal-grid opacity-25" />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Assigned transit route
                  </div>
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
                    <RouteIcon className="h-4 w-4 text-emerald-400" />
                    {route.code}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">{route.name}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RouteStatusBadge status={telemetry.routeStatus} />
                  <span className="font-mono text-[10px] text-slate-500">{route.distanceKm} km corridor</span>
                </div>
              </div>

              <div className="relative mt-7">
                <div className="absolute left-3 right-3 top-[5px] h-px bg-white/10" />
                <div
                  className="absolute left-3 top-[5px] h-px bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${Math.max(0, Math.min(94, progress * 0.94))}%` }}
                />
                <div className="relative flex justify-between gap-1">
                  {route.checkpoints.map((checkpoint, index) => {
                    const done = index < telemetry.checkpointIndex;
                    const current = index === telemetry.checkpointIndex;
                    return (
                      <div key={checkpoint} className="flex w-[22%] flex-col items-center gap-2">
                        <span
                          className={cn(
                            'relative flex h-[11px] w-[11px] items-center justify-center rounded-full border transition',
                            done
                              ? 'border-emerald-400 bg-emerald-400'
                              : current
                                ? 'border-emerald-300 bg-slate-950'
                                : 'border-slate-700 bg-slate-950',
                          )}
                        >
                          {current ? (
                            <span className="h-[5px] w-[5px] rounded-full bg-emerald-300 animate-ping-soft" />
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            'text-center text-[10px] leading-tight',
                            current ? 'font-semibold text-emerald-300' : done ? 'text-slate-400' : 'text-slate-600',
                          )}
                        >
                          {checkpoint}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-0 sm:grid-cols-2">
              <div className="flex items-center gap-5 border-b border-white/[0.06] p-5 sm:border-b-0 sm:border-r">
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <defs>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#speedGrad)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - speedPct)}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-bold tabular-nums text-white">{telemetry.speedKph}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">km/h</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <Gauge className="h-3 w-3" />
                    Live velocity
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    {onRoute ? 'Rolling telemetry' : 'Signal held'}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    {onRoute
                      ? 'Pinging control plane every 3.4s.'
                      : 'Speed reads zero while the manifest is flagged.'}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={cn(
                          'w-1 rounded-sm',
                          bar < (onRoute ? 4 : 2) ? 'bg-emerald-400/80' : 'bg-white/10',
                        )}
                        style={{ height: `${4 + bar * 2.2}px` }}
                      />
                    ))}
                    <span className="ml-1.5 font-mono text-[9px] text-slate-500">
                      {dispatch.telemetry.lastPing ? timeAgo(dispatch.telemetry.lastPing) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Satellite className="h-3 w-3" />
                  GPS anchor
                </div>
                <div className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-emerald-500" />
                    {gpsLock[0]}
                  </div>
                  <div className="pl-[18px]">{gpsLock[1]}</div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/[0.07] px-2 py-1 text-[10px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                  <MapPin className="h-3 w-3" />
                  {currentCheckpoint}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => advanceCheckpoint(dispatch.id)}
                  >
                    Advance checkpoint
                  </Button>
                  <Tooltip label="Simulation only — telemetry streams automatically while On Route." />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-black/20 px-5 py-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                Telemetry uplink encrypted · device CG-D4
              </div>
              <div className="flex items-center gap-2">
                {dispatch.status === 'AWAITING_RETURN' ? (
                  <Badge tone="amber" dot>
                    Return leg · customer verified
                  </Badge>
                ) : null}
                <SealBadge state={dispatch.sealState} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Route status control"
              subtitle="Status changes are broadcast to the vendor control plane in real time."
              icon={<Navigation className="h-4 w-4" />}
              action={
                sealed ? (
                  <Badge tone="emerald" dot>
                    Authorised to update
                  </Badge>
                ) : (
                  <Badge tone="slate">Locked · return leg</Badge>
                )
              }
            />
            <div className="grid gap-2.5 p-5 sm:grid-cols-3">
              {statusOptions.map((option) => {
                const active = telemetry.routeStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!sealed}
                    onClick={() => setRouteStatus(dispatch.id, option.value)}
                    className={cn(
                      'group flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
                      active
                        ? option.value === 'DEVIATED'
                          ? 'border-amber-400/40 bg-amber-400/[0.08]'
                          : 'border-emerald-500/40 bg-emerald-500/[0.07]'
                        : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset',
                        active
                          ? option.value === 'DEVIATED'
                            ? 'bg-amber-400/10 text-amber-300 ring-amber-400/30'
                            : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                          : 'bg-white/[0.03] text-slate-500 ring-white/[0.06]',
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-slate-200">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">{option.copy}</span>
                    </span>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Current
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <Card className="overflow-hidden border-emerald-500/15">
            <CardHeader
              title="Cargo hold inspection"
              subtitle="Read-only mirror of the sealed manifest."
              icon={<PackageSearch className="h-4 w-4" />}
              action={
                <Badge tone="slate">
                  <Lock className="h-2.5 w-2.5" />
                  Read-only
                </Badge>
              }
              compact
            />
            <div className="p-4">
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3.5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400/80">
                    Total in hold
                  </div>
                  <div className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-white">
                    {num(dispatch.orderQty + dispatch.bufferQty)}
                    <span className="ml-1 text-xs font-medium text-slate-500">units</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] text-slate-500">{dispatch.sealId}</div>
                  <div className="mt-1">
                    <SealBadge state={dispatch.sealState} />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Core', value: cargo.coreIntact, tone: 'text-slate-100', sub: 'customer order' },
                  { label: 'Buffer', value: cargo.unusedBuffer, tone: 'text-cyan-300', sub: 'sealed spare' },
                  { label: 'Damaged', value: cargo.damaged, tone: 'text-amber-300', sub: 'customer swap' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</div>
                    <div className={cn('mt-0.5 font-mono text-lg font-bold tabular-nums', item.tone)}>{item.value}</div>
                    <div className="text-[9px] text-slate-600">{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <p className="text-[10px] leading-relaxed text-slate-500">
                  Hold counts are attested by the vendor at seal time and cannot be edited from the driver device.
                </p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Emergency / breakdown reporting"
              subtitle="Log the incident before the delay becomes a dispute."
              icon={<Siren className="h-4 w-4" />}
              action={<Badge tone="red" dot pulse>P1</Badge>}
            />
            <div className="space-y-3 p-4">
              <div className="grid gap-2">
                {(Object.keys(INCIDENT_META) as IncidentType[]).map((type) => {
                  const meta = INCIDENT_META[type];
                  const Icon = incidentIcons[type];
                  const active = incidentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIncidentType(type)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-3 text-left transition',
                        active
                          ? 'border-rose-500/45 bg-rose-500/[0.08]'
                          : 'border-white/[0.07] bg-white/[0.02] hover:border-rose-500/25 hover:bg-white/[0.04]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                          active
                            ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30'
                            : 'bg-white/[0.03] text-slate-500 ring-white/[0.06]',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold leading-snug text-slate-200">{meta.label}</span>
                        <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">{meta.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <Textarea
                value={incidentNote}
                onChange={(event) => setIncidentNote(event.target.value)}
                placeholder="Optional context for the vendor desk (e.g., rear tyre burst near Airoli bridge)."
                className="min-h-[64px] text-xs"
                aria-label="Incident context"
              />

              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2 font-mono text-[10px] text-slate-500">
                <MapPin className="h-3 w-3 shrink-0 text-emerald-500" />
                <span className="truncate">{telemetry.gps}</span>
                <span className="ml-auto shrink-0 text-slate-600">{formatTime(new Date().toISOString())}</span>
              </div>

              <Button variant="danger" className="w-full" disabled={!incidentType} onClick={submitIncident}>
                <Siren className="h-4 w-4" />
                Broadcast incident beacon
              </Button>
              <p className="text-center text-[10px] leading-relaxed text-slate-600">
                Sends timestamp + GPS anchor instantly. Driver is protected from unavoidable-delay penalties.
              </p>

              {dispatch.incidents.length > 0 ? (
                <div className="space-y-2 border-t border-white/[0.06] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Logged incidents
                    </span>
                    <Badge tone="red">{dispatch.incidents.length}</Badge>
                  </div>
                  {dispatch.incidents.slice(0, 3).map((incident) => {
                    const Icon = incidentIcons[incident.type];
                    return (
                      <div
                        key={incident.id}
                        className="flex items-start gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2"
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-slate-300">
                              {INCIDENT_META[incident.type].short}
                            </span>
                            <span className="shrink-0 font-mono text-[9px] text-slate-600">
                              {formatTime(incident.timestamp)}
                            </span>
                          </div>
                          {incident.note ? (
                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                              {incident.note}
                            </p>
                          ) : null}
                          <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-slate-600">
                            <MapPin className="h-2.5 w-2.5" />
                            {incident.gps}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-white/[0.07] px-3 py-2.5 text-[10px] text-slate-600">
                  <CircleDot className="h-3 w-3" />
                  No incidents logged on this manifest.
                </div>
              )}
            </div>
          </Card>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-900/40 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ArrowLeftRight className="h-3.5 w-3.5 text-slate-600" />
              Declared buffer value
            </div>
            <span className="font-mono text-xs font-semibold text-slate-300">
              {inr(dispatch.bufferQty * UNIT_VALUE_INR)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
