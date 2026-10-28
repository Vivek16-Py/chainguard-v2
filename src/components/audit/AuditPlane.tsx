import { useState } from 'react';
import { ClipboardCheck, Download, Scale, ShieldCheck, Truck } from 'lucide-react';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badges';
import { useChainGuard } from '@/store/useChainGuard';
import { MetricGrid } from '@/components/audit/MetricGrid';
import { FleetTable } from '@/components/audit/FleetTable';
import { ReturnCheckIn } from '@/components/audit/ReturnCheckIn';
import { ExceptionFeed } from '@/components/audit/ExceptionFeed';
import { Scorecard } from '@/components/audit/Scorecard';
import { exportManifestCsv } from '@/lib/export';
import { computeMetrics } from '@/lib/metrics';

export function AuditPlane() {
  const dispatches = useChainGuard((state) => state.dispatches);
  const pushToast = useChainGuard((state) => state.pushToast);
  const setRole = useChainGuard((state) => state.setRole);
  const [checkInFocus, setCheckInFocus] = useState<string | null>(null);
  const metrics = computeMetrics(dispatches);

  const handleExport = () => {
    exportManifestCsv(dispatches);
    pushToast({
      tone: 'info',
      title: 'Manifest exported',
      message: `${dispatches.length} dispatch records written to CSV with the current custody state.`,
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Vendor audit & reconciliation control plane"
        title="Every unit accounted for — or the payout freezes."
        description="The owner-side war room: live fleet state, tamper-evident cargo manifests, warehouse reconciliation and a driver integrity ledger in one auditable surface."
        icon={<ClipboardCheck className="h-3 w-3" />}
        actions={
          <>
            <Badge tone="emerald" dot pulse className="h-9 px-3">
              {metrics.complianceRate}% compliance
            </Badge>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export manifest
            </Button>
            <Button onClick={() => setRole('vendor')}>
              <Truck className="h-4 w-4" />
              New dispatch
            </Button>
          </>
        }
      />

      <MetricGrid />

      <FleetTable dispatches={dispatches} onCheckIn={setCheckInFocus} />

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ReturnCheckIn focusId={checkInFocus} />
        </div>
        <div className="xl:col-span-5">
          <ExceptionFeed />
        </div>
      </div>

      <Scorecard />

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            <Scale className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-200">Reconciliation doctrine</div>
            <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-slate-500">
              Customer swap attestation reduces the intact buffer obligation but never the total expected return.
              (Buffer − swapped) + damaged = full buffer, to the unit. Any variance is treated as shrinkage until proven
              otherwise.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Immutable audit ledger · protocol v2.4
        </div>
      </div>
    </div>
  );
}
