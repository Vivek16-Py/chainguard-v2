import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Siren,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badges';
import { QtyInput, Select } from '@/components/ui/Field';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChainGuard } from '@/store/useChainGuard';
import { cn, formatDateTime } from '@/lib/utils';

interface CheckInResult {
  dispatchId: string;
  driverName: string;
  expected: number;
  received: number;
  shortage: number;
  damageMismatch: boolean;
  payoutLocked: boolean;
}

export function ReturnCheckIn({ focusId }: { focusId: string | null }) {
  const dispatches = useChainGuard((state) => state.dispatches);
  const checkInReturn = useChainGuard((state) => state.checkInReturn);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const awaiting = useMemo(
    () => dispatches.filter((dispatch) => dispatch.status === 'AWAITING_RETURN'),
    [dispatches],
  );

  const [selectedId, setSelectedId] = useState<string>(awaiting[0]?.id ?? '');
  const [intact, setIntact] = useState('');
  const [damaged, setDamaged] = useState('');
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const dispatch = awaiting.find((item) => item.id === selectedId) ?? awaiting[0];
  const delivery = dispatch?.delivery;

  const expectedIntact = dispatch && delivery ? dispatch.bufferQty - delivery.damagedSwapped : 0;
  const expectedDamaged = delivery?.damagedSwapped ?? 0;
  const expectedTotal = delivery?.expectedReturn ?? dispatch?.bufferQty ?? 0;

  useEffect(() => {
    if (!dispatch) return;
    setIntact(String(expectedIntact));
    setDamaged(String(expectedDamaged));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch?.id]);

  useEffect(() => {
    if (!focusId) return;
    if (dispatches.some((item) => item.id === focusId && item.status === 'AWAITING_RETURN')) {
      setSelectedId(focusId);
      const target = dispatches.find((item) => item.id === focusId);
      if (target?.delivery) {
        setIntact(String(target.bufferQty - target.delivery.damagedSwapped));
        setDamaged(String(target.delivery.damagedSwapped));
      }
    }
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const intactNum = Math.max(0, Math.floor(Number(intact) || 0));
  const damagedNum = Math.max(0, Math.floor(Number(damaged) || 0));
  const received = intactNum + damagedNum;
  const variance = expectedTotal - received;
  const damageMismatch = damagedNum !== expectedDamaged;
  const willLock = variance !== 0;

  const fillExpected = () => {
    setIntact(String(expectedIntact));
    setDamaged(String(expectedDamaged));
  };

  const simulateShortfall = () => {
    setIntact(String(Math.max(0, expectedIntact - 2)));
    setDamaged(String(expectedDamaged));
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const target = dispatches.find((item) => item.id === id);
    if (target?.delivery) {
      setIntact(String(target.bufferQty - target.delivery.damagedSwapped));
      setDamaged(String(target.delivery.damagedSwapped));
    }
  };

  const submit = () => {
    if (!dispatch) return;
    const record = checkInReturn(dispatch.id, { intactReturned: intactNum, damagedReturned: damagedNum });
    if (record) {
      setLastResult({
        dispatchId: dispatch.id,
        driverName: dispatch.driverName,
        expected: record.expected,
        received: record.intactReturned + record.damagedReturned,
        shortage: record.shortage,
        damageMismatch: record.damageMismatch,
        payoutLocked: record.payoutLocked,
      });
    }
  };

  return (
    <div ref={sectionRef} className="scroll-mt-24">
      <Card className="overflow-hidden">
        <CardHeader
          title="Warehouse return check-in"
          subtitle="Count returned buffer stock against the customer-attested manifest."
          icon={<Building2 className="h-4 w-4" />}
          action={
            <Badge tone={awaiting.length > 0 ? 'amber' : 'cyan'} dot={awaiting.length > 0}>
              {awaiting.length} awaiting
            </Badge>
          }
        />

        <div className="space-y-4 p-5">
          {lastResult ? (
            <div
              className={cn(
                'relative animate-slide-up overflow-hidden rounded-xl border p-3.5',
                lastResult.payoutLocked
                  ? 'border-rose-500/35 bg-rose-500/[0.07]'
                  : 'border-emerald-500/25 bg-emerald-500/[0.05]',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                    lastResult.payoutLocked
                      ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
                  )}
                >
                  {lastResult.payoutLocked ? <Siren className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">
                      {lastResult.dispatchId} {lastResult.payoutLocked ? 'flagged · settlement locked' : 'fully reconciled'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{lastResult.driverName}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {lastResult.received} of {lastResult.expected} units returned
                    {lastResult.shortage !== 0
                      ? ` · ${lastResult.shortage > 0 ? `${lastResult.shortage} missing` : `${Math.abs(lastResult.shortage)} surplus`}`
                      : ' · exact match'}
                    {lastResult.damageMismatch ? ' · damage attestation mismatch' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLastResult(null)}
                  className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                  aria-label="Dismiss result"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {awaiting.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-5 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/50 text-emerald-400 ring-1 ring-inset ring-white/[0.06]">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-xs font-semibold text-slate-200">No trucks awaiting check-in</h3>
              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
                When a customer authorises a seal break, the manifest lands here for mandatory buffer reconciliation.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="return-dispatch"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Scan / select returning dispatch
                </label>
                <div className="relative">
                  <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <Select
                    id="return-dispatch"
                    value={dispatch?.id ?? ''}
                    onChange={(event) => handleSelect(event.target.value)}
                    className="pl-9 font-mono text-xs"
                  >
                    {awaiting.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id} · {item.driverName} · {item.sealId}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {dispatch && delivery ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] px-2.5 py-2">
                      <div className="text-[8px] font-semibold uppercase tracking-wider text-emerald-400/80">
                        Expected back
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-emerald-300">{expectedTotal}</div>
                      <div className="text-[8px] text-slate-500">buffer units</div>
                    </div>
                    <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] px-2.5 py-2">
                      <div className="text-[8px] font-semibold uppercase tracking-wider text-cyan-400/80">
                        Intact due
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-cyan-300">{expectedIntact}</div>
                      <div className="text-[8px] text-slate-500">unused buffer</div>
                    </div>
                    <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-2.5 py-2">
                      <div className="text-[8px] font-semibold uppercase tracking-wider text-amber-400/80">
                        Damaged due
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-amber-300">{expectedDamaged}</div>
                      <div className="text-[8px] text-slate-500">customer swap</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                    <p className="line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                      <span className="font-semibold text-slate-400">Customer attestation:</span>{' '}
                      {dispatch.clientName} · {delivery.note || 'No note provided.'}
                    </p>
                    <Tooltip label={`Unlock token ${delivery.unlockToken} · authorised ${formatDateTime(delivery.confirmedAt)}`} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="intact-returned" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Intact buffer returned
                      </label>
                      <QtyInput
                        id="intact-returned"
                        min={0}
                        value={intact}
                        onChange={(event) => setIntact(event.target.value)}
                      />
                      <div className="mt-1 text-[9px] text-slate-600">Counted by warehouse operator</div>
                    </div>
                    <div>
                      <label htmlFor="damaged-returned" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Damaged units returned
                      </label>
                      <QtyInput
                        id="damaged-returned"
                        min={0}
                        value={damaged}
                        onChange={(event) => setDamaged(event.target.value)}
                      />
                      <div className="mt-1 text-[9px] text-slate-600">
                        Attested {expectedDamaged} by customer
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={fillExpected} className="flex-1">
                      <RotateCcw className="h-3 w-3" />
                      Load expected return
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={simulateShortfall}
                      className="flex-1 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <TriangleAlert className="h-3 w-3" />
                      Simulate 2-unit shortfall
                    </Button>
                  </div>

                  <div
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-3',
                      variance > 0
                        ? 'border-rose-500/35 bg-rose-500/[0.07]'
                        : variance < 0
                          ? 'border-amber-400/30 bg-amber-400/[0.06]'
                          : damageMismatch
                            ? 'border-amber-400/30 bg-amber-400/[0.06]'
                            : 'border-emerald-500/25 bg-emerald-500/[0.05]',
                    )}
                  >
                    <span className="mt-0.5">
                      {variance > 0 ? (
                        <Siren className="h-4 w-4 text-rose-400" />
                      ) : variance < 0 || damageMismatch ? (
                        <TriangleAlert className="h-4 w-4 text-amber-300" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-slate-100">
                        {variance > 0
                          ? `Shrinkage exposure · ${variance} unit(s) unaccounted`
                          : variance < 0
                            ? `Surplus · ${Math.abs(variance)} unit(s) above manifest`
                            : damageMismatch
                              ? 'Counts match · damage attestation differs'
                              : 'Manifest reconciles exactly'}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                        expected {expectedTotal} · received {received} · variance{' '}
                        {variance === 0 ? '0' : `${variance > 0 ? '−' : '+'}${Math.abs(variance)}`}
                      </div>
                      {variance !== 0 ? (
                        <div className="mt-1 text-[9px] leading-relaxed text-slate-500">
                          Submitting will raise a Priority-1 alert and lock the driver&apos;s shift settlement.
                        </div>
                      ) : damageMismatch ? (
                        <div className="mt-1 text-[9px] leading-relaxed text-slate-500">
                          Returned damage count does not match the customer attestation. An audit note will be attached.
                        </div>
                      ) : null}
                    </div>
                    {variance !== 0 ? (
                      <Badge tone="red" className="shrink-0">
                        <Lock className="h-2.5 w-2.5" />
                        Payout lock
                      </Badge>
                    ) : (
                      <Badge tone="emerald" className="shrink-0">
                        Cleared
                      </Badge>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    variant={willLock ? 'danger' : 'primary'}
                    onClick={submit}
                  >
                    {willLock ? <Siren className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}
                    {willLock ? 'Complete check-in · raise shrinkage alert' : 'Complete warehouse check-in'}
                    <ArrowDownToLine className="h-4 w-4 opacity-70" />
                  </Button>
                </>
              ) : null}
            </>
          )}

          <p className="text-center text-[9px] leading-relaxed text-slate-600">
            Reconciliation is final. Counts are hashed into the seal record and cannot be edited after submission.
          </p>
        </div>
      </Card>
    </div>
  );
}
