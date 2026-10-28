import type { ReactNode } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Siren,
  OctagonAlert,
  Clock3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTE_STATUS_META } from '@/lib/constants';
import type { DispatchStatus, RouteStatus, SealState } from '@/types';

type Tone = 'emerald' | 'amber' | 'red' | 'slate' | 'cyan' | 'violet' | 'orange';

const toneClasses: Record<Tone, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  red: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  slate: 'bg-slate-500/10 text-slate-300 ring-slate-400/20',
  cyan: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/25',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/25',
  orange: 'bg-orange-500/10 text-orange-300 ring-orange-500/25',
};

const dotClasses: Record<Tone, string> = {
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-rose-400',
  slate: 'bg-slate-400',
  cyan: 'bg-cyan-400',
  violet: 'bg-violet-400',
  orange: 'bg-orange-400',
};

export function Badge({
  tone = 'slate',
  children,
  dot = false,
  pulse = false,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
    >
      {dot ? (
        <span className="relative flex h-1.5 w-1.5">
          {pulse ? (
            <span
              className={cn('absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping-soft', dotClasses[tone])}
            />
          ) : null}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotClasses[tone])} />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const meta = ROUTE_STATUS_META[status];
  const icon =
    status === 'ON_ROUTE' ? (
      <CheckCircle2 className="h-3 w-3" />
    ) : status === 'INCIDENT' ? (
      <Siren className="h-3 w-3" />
    ) : status === 'STOPPED' ? (
      <Clock3 className="h-3 w-3" />
    ) : (
      <OctagonAlert className="h-3 w-3" />
    );
  return (
    <Badge tone={meta.tone} dot={status !== 'STOPPED'} pulse={status === 'INCIDENT'}>
      {icon}
      {meta.label}
    </Badge>
  );
}

export function SealBadge({ state }: { state: SealState }) {
  const map: Record<SealState, { label: string; tone: Tone; icon: ReactNode }> = {
    SEALED: { label: 'Seal intact', tone: 'emerald', icon: <ShieldCheck className="h-3 w-3" /> },
    BROKEN: { label: 'Seal broken · token', tone: 'amber', icon: <Lock className="h-3 w-3" /> },
    RECONCILED: { label: 'Chain closed', tone: 'cyan', icon: <BadgeCheck className="h-3 w-3" /> },
    VOIDED: { label: 'Tamper void', tone: 'red', icon: <ShieldAlert className="h-3 w-3" /> },
  };
  const meta = map[state];
  return (
    <Badge tone={meta.tone} dot pulse={state === 'VOIDED'}>
      {meta.icon}
      {meta.label}
    </Badge>
  );
}

export function DispatchStatusBadge({ status }: { status: DispatchStatus }) {
  const map: Record<DispatchStatus, { label: string; tone: Tone; pulse: boolean }> = {
    EN_ROUTE_SEALED: { label: 'En route · sealed', tone: 'emerald', pulse: false },
    AWAITING_RETURN: { label: 'Awaiting return', tone: 'amber', pulse: false },
    RECONCILED: { label: 'Reconciled', tone: 'cyan', pulse: false },
    FRAUD_FLAGGED: { label: 'Fraud flagged', tone: 'red', pulse: true },
  };
  const meta = map[status];
  return (
    <Badge tone={meta.tone} dot pulse={meta.pulse}>
      {meta.label}
    </Badge>
  );
}

export function TrustBadge({ rating }: { rating: string }) {
  const map: Record<string, Tone> = {
    Elite: 'emerald',
    Trusted: 'cyan',
    Watchlist: 'amber',
    Flagged: 'red',
    Provisioned: 'slate',
  };
  return <Badge tone={map[rating] ?? 'slate'}>{rating}</Badge>;
}

export function TrustMeter({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 92 ? 'bg-emerald-400' : score >= 78 ? 'bg-cyan-400' : score >= 60 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-300">{score}</span>
    </div>
  );
}
