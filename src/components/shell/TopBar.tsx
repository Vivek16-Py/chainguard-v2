import {
  Activity,
  Bell,
  Building2,
  ClipboardCheck,
  ShieldCheck,
  Smartphone,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useChainGuard } from '@/store/useChainGuard';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

const roles: { id: Role; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'vendor', label: 'Vendor Dispatch', short: 'Vendor', icon: Building2 },
  { id: 'driver', label: 'Driver Telemetry', short: 'Driver', icon: Truck },
  { id: 'customer', label: 'Customer Verify', short: 'Customer', icon: Smartphone },
  { id: 'audit', label: 'Audit & Recon', short: 'Audit', icon: ClipboardCheck },
];

function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const role = useChainGuard((state) => state.role);
  const setRole = useChainGuard((state) => state.setRole);

  return (
    <div
      role="tablist"
      aria-label="Operational perspective"
      className="inline-flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-slate-900/70 p-1 shadow-inner shadow-black/40"
    >
      {roles.map((item) => {
        const active = role === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => setRole(item.id)}
            className={cn(
              'group inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold tracking-tight transition-all duration-150',
              active
                ? 'bg-emerald-500/[0.14] text-emerald-200 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.28)]'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
            )}
          >
            <item.icon
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                active ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300',
              )}
            />
            {compact ? item.short : item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TopBar() {
  const fraudAlerts = useChainGuard(
    (state) => state.dispatches.filter((dispatch) => dispatch.status === 'FRAUD_FLAGGED').length,
  );
  const setRole = useChainGuard((state) => state.setRole);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/5 ring-1 ring-inset ring-emerald-500/30">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-tight text-white">ChainGuard</span>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                  v2.4
                </span>
              </div>
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:block">
                Last-mile integrity control plane
              </p>
            </div>
          </div>

          <div className="hidden xl:block">
            <RoleSwitcher />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 md:flex">
              <Activity className="h-3 w-3" />
              Chain live
            </div>
            <button
              type="button"
              onClick={() => setRole('audit')}
              aria-label={`${fraudAlerts} fraud alerts — open audit plane`}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-slate-900/60 text-slate-400 transition hover:border-rose-500/30 hover:text-rose-300"
            >
              <Bell className="h-4 w-4" />
              {fraudAlerts > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-slate-950">
                  {fraudAlerts}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 xl:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <RoleSwitcher compact />
        </div>
      </div>
    </header>
  );
}
