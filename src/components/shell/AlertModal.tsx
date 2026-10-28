import { Fingerprint, LockKeyhole, ShieldAlert, Siren, TriangleAlert } from 'lucide-react';
import { useChainGuard } from '@/store/useChainGuard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatTime } from '@/lib/utils';

export function AlertModal() {
  const alert = useChainGuard((state) => state.alert);
  const dismissAlert = useChainGuard((state) => state.dismissAlert);
  const setRole = useChainGuard((state) => state.setRole);
  const dispatches = useChainGuard((state) => state.dispatches);

  const dispatch = alert ? dispatches.find((item) => item.id === alert.dispatchId) : undefined;
  const isSurplus = alert ? alert.received > alert.expected : false;

  return (
    <Modal open={alert !== null} onClose={dismissAlert} labelledBy="shrinkage-title" dismissible>
      {alert ? (
        <div className="overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-b from-[#1b0710] via-slate-950 to-slate-950 shadow-alarm">
          <div className="relative border-b border-rose-500/20 bg-rose-500/[0.07] px-6 py-5">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(135deg,rgba(244,63,94,0.12)_0px,rgba(244,63,94,0.12)_1px,transparent_1px,transparent_9px)]" />
            <div className="relative flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 animate-alarm items-center justify-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/40">
                <Siren className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                  Priority 1 · Settlement hold
                </div>
                <h2 id="shrinkage-title" className="mt-1 text-lg font-bold leading-snug tracking-tight text-white">
                  {isSurplus ? 'MANIFEST OVERAGE DETECTED' : 'CRITICAL SHRINKAGE DETECTED'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
                  {isSurplus
                    ? `Driver ${alert.driverName} returned ${alert.shortage} unit(s) above the sealed manifest. Reconciliation frozen pending audit.`
                    : `Driver ${alert.driverName} unaccounted for ${alert.shortage} buffer unit(s). Shift settlement payout locked.`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Expected', value: alert.expected, tone: 'text-slate-200' },
                { label: 'Received', value: alert.received, tone: 'text-amber-300' },
                {
                  label: isSurplus ? 'Overage' : 'Shortfall',
                  value: alert.shortage,
                  tone: 'text-rose-400',
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{stat.label}</div>
                  <div className={`mt-1 font-mono text-xl font-bold tabular-nums ${stat.tone}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-xs">
              <Row label="Dispatch" value={`${alert.dispatchId} · ${alert.sealId}`} />
              <Row label="Vehicle" value={alert.vehicleId} />
              <Row label="Custody" value={`${alert.intactReturned} intact + ${alert.damagedReturned} damaged returned`} />
              <Row label="Attested damage" value={`${alert.expectedDamaged} unit(s) swapped by customer`} />
              <Row label="Seal state" value="BROKEN → VOIDED · chain of custody sealed" danger />
              <Row
                label="Payout"
                value={`LOCKED · ${dispatch ? formatTime(dispatch.returnRecord?.checkedInAt ?? new Date().toISOString()) : '—'}`}
                danger
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
              <p className="text-[11px] leading-relaxed text-rose-200/80">
                Evidence package (telemetry trail, incident beacons, customer attestation and seal token) has been
                frozen and attached to the driver settlement record.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
              <Fingerprint className="h-3 w-3 text-slate-600" />
              Evidence hash anchored · immutable audit log
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/[0.06] bg-black/20 px-6 py-4 sm:flex-row">
            <Button variant="danger" className="flex-1" onClick={dismissAlert}>
              <LockKeyhole className="h-4 w-4" />
              Acknowledge &amp; lock settlement
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                dismissAlert();
                setRole('audit');
              }}
            >
              <ShieldAlert className="h-4 w-4" />
              Review file
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-medium ${danger ? 'text-rose-300' : 'text-slate-300'}`}>{value}</span>
    </div>
  );
}
