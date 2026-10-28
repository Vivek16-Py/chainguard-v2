import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Fingerprint,
  KeyRound,
  Lock,
  MapPin,
  PackageCheck,
  PenLine,
  QrCode,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Truck,
  Unlock,
  UserRound,
  Wifi,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Card';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badges';
import { QtyInput, Select, Textarea } from '@/components/ui/Field';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChainGuard } from '@/store/useChainGuard';
import { UNIT_VALUE_INR, getRoute } from '@/lib/constants';
import { cn, formatDateTime, formatTime, inr, num } from '@/lib/utils';
import { useCopy } from '@/hooks/useCopy';
import type { Dispatch } from '@/types';

export function CustomerPortal() {
  const dispatches = useChainGuard((state) => state.dispatches);
  const authorizeDelivery = useChainGuard((state) => state.authorizeDelivery);
  const setRole = useChainGuard((state) => state.setRole);
  const { copied, copy } = useCopy();

  const scannable = useMemo(
    () =>
      dispatches.filter(
        (dispatch) =>
          (dispatch.status === 'EN_ROUTE_SEALED' && dispatch.sealState === 'SEALED') ||
          dispatch.delivery !== undefined,
      ),
    [dispatches],
  );

  const [selectedId, setSelectedId] = useState<string>(scannable[0]?.id ?? '');

  const dispatch =
    scannable.find((item) => item.id === selectedId) ??
    scannable.find((item) => item.status === 'EN_ROUTE_SEALED') ??
    scannable[0];

  const [intact, setIntact] = useState<string>('');
  const [damaged, setDamaged] = useState<string>('0');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (dispatch && !dispatch.delivery) {
      setIntact(String(dispatch.orderQty));
      setDamaged('0');
      setNote('');
      setProof('');
      setError(null);
    }
  }, [dispatch?.id, dispatch?.delivery]);

  if (!dispatch) {
    return (
      <div>
        <PageHeader
          eyebrow="Customer verification portal"
          title="No seal available to scan."
          description="A customer can only verify a consignment that is currently sealed and en route. Once a vendor dispatches a manifest, the QR handshake becomes available here."
          icon={<Smartphone className="h-3 w-3" />}
        />
        <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 ring-1 ring-inset ring-white/[0.06]">
            <QrCode className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-slate-200">Nothing awaiting verification</h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            All sealed manifests have already been verified, or none have been dispatched yet.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => setRole('vendor')}>
            Open vendor terminal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  const route = getRoute(dispatch.routeId);
  const delivery = dispatch.delivery;
  const verified = delivery !== undefined;
  const intactNum = Math.max(0, Math.floor(Number(intact) || 0));
  const damagedNum = Math.max(0, Math.floor(Number(damaged) || 0));
  const unusedBuffer = Math.max(0, dispatch.bufferQty - damagedNum);
  const expectedReturn = dispatch.bufferQty;
  const proofRecord = dispatch.returnRecord;

  const damagedError = damagedNum > dispatch.bufferQty;
  const intactError = intactNum > dispatch.orderQty;
  const noteError = damagedNum > 0 && note.trim().length < 6;
  const canAuthorize =
    !verified && !damagedError && !intactError && !noteError && intactNum >= 0 && intactNum <= dispatch.orderQty;

  const authorize = () => {
    setError(null);
    if (damagedError) {
      setError(`Damage swaps cannot exceed the ${dispatch.bufferQty} declared buffer units.`);
      return;
    }
    if (intactError) {
      setError(`Received units cannot exceed the ${dispatch.orderQty} contracted core units.`);
      return;
    }
    if (noteError) {
      setError('A customer note or signature is mandatory when damaged units are swapped from buffer.');
      return;
    }
    const payloadNote = proof ? `${note.trim()}\nProof attached: ${proof}` : note.trim();
    const result = authorizeDelivery(dispatch.id, {
      intactReceived: intactNum,
      damagedSwapped: damagedNum,
      note: payloadNote,
    });
    if (!result) {
      setError('This seal is no longer verifiable. Refresh the scan or contact the vendor.');
      return;
    }
    setSelectedId(dispatch.id);
  };

  const fillSignature = () => {
    setNote(`Signed by ${dispatch.clientName} · seal ${dispatch.sealId} inspected at door.`);
    setError(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Customer verification portal"
        title="Break the seal only with consent."
        description="Scan the tamper-evident QR at the doorstep. Confirm what actually arrived, swap only from the declared buffer, and freeze the mandatory return count in one consent event."
        icon={<Smartphone className="h-3 w-3" />}
        actions={
          <>
            <Badge tone="cyan" dot className="h-9 px-3">
              QR handshake v2
            </Badge>
            <Button variant="secondary" onClick={() => setRole('audit')}>
              <ClipboardCheck className="h-4 w-4" />
              Audit trail
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/25">
            <ScanLine className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Scanned seal
            </div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-slate-200">{dispatch.sealId}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            aria-label="Select scanned seal"
            value={dispatch.id}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setError(null);
            }}
            className="h-9 py-0 text-xs"
          >
            {scannable.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sealId} · {item.clientName} {item.delivery ? '(verified)' : ''}
              </option>
            ))}
          </Select>
          <Badge tone={verified ? 'slate' : 'emerald'} dot={!verified} pulse={!verified}>
            {verified ? 'Token spent' : 'Seal intact'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-12 xl:gap-10">
        <div className="xl:col-span-6">
          <div className="relative mx-auto w-full max-w-[400px]">
            <div className="pointer-events-none absolute -inset-8 rounded-[4rem] bg-emerald-500/[0.07] blur-3xl" />
            <div className="relative rounded-[2.9rem] border border-white/10 bg-slate-950 p-2.5 shadow-[0_50px_140px_-50px_rgba(16,185,129,0.45)] ring-1 ring-white/[0.06]">
              <div className="overflow-hidden rounded-[2.35rem] border border-white/[0.06] bg-[#050a15]">
                <div className="relative flex items-center justify-between bg-slate-950/80 px-6 pb-1 pt-3 text-[10px] font-semibold text-slate-400">
                  <span className="font-mono">{formatTime(new Date().toISOString())}</span>
                  <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/[0.06]" />
                  <span className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    5G
                    <span className="ml-1 inline-block h-2.5 w-4 rounded-[2px] border border-slate-500 p-[1.5px]">
                      <span className="block h-full w-2/3 rounded-[1px] bg-emerald-400" />
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[11px] font-bold tracking-tight text-slate-100">ChainGuard Verify</div>
                      <div className="text-[8px] uppercase tracking-[0.14em] text-slate-500">Doorstep handoff</div>
                    </div>
                  </div>
                  <div className="relative">
                    <QrCode className="h-7 w-7 text-slate-500" />
                    <span className="absolute inset-x-0 top-0 h-px animate-scan bg-emerald-400/80 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
                  </div>
                </div>

                <div className="px-5 pb-5 pt-4">
                  {verified && delivery ? (
                    <VerifiedState
                      dispatch={dispatch}
                      copied={copied}
                      onCopy={() => copy(delivery.unlockToken)}
                      onAudit={() => setRole('audit')}
                    />
                  ) : (
                    <>
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full border border-emerald-400/40" />
                            </span>
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                                SEAL INTACT
                              </div>
                              <div className="font-mono text-[9px] text-emerald-200/60">{dispatch.sealId}</div>
                            </div>
                          </div>
                          <Badge tone="emerald" dot>
                            Verified
                          </Badge>
                        </div>
                        <div className="mt-2.5 flex items-center gap-1 border-t border-emerald-500/15 pt-2 font-mono text-[8px] text-emerald-200/50">
                          <Fingerprint className="h-2.5 w-2.5" />
                          HASH 0x{dispatch.sealId.replace(/[^0-9A-Z]/g, '').slice(0, 12).toLowerCase()}…7f2a
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Shipment
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-snug text-slate-100">
                          {dispatch.clientName}
                        </div>
                        <div className="mt-0.5 flex items-start gap-1 text-[10px] leading-relaxed text-slate-500">
                          <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                          {dispatch.address}
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
                          <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-inset ring-white/[0.05]">
                            <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-600">
                              <UserRound className="h-2.5 w-2.5" /> Driver
                            </div>
                            <div className="mt-0.5 truncate font-medium text-slate-300">{dispatch.driverName}</div>
                          </div>
                          <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-inset ring-white/[0.05]">
                            <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-600">
                              <Truck className="h-2.5 w-2.5" /> Vehicle
                            </div>
                            <div className="mt-0.5 font-mono text-[9px] font-medium text-slate-300">
                              {dispatch.vehicleId}
                            </div>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[9px] ring-1 ring-inset ring-white/[0.05]">
                          <span className="text-slate-500">{route.code} corridor</span>
                          <span className="font-mono text-slate-300">
                            {dispatch.orderQty} core + {dispatch.bufferQty} buffer
                          </span>
                        </div>
                      </div>

                      <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Verify the handoff
                          </span>
                          <Tooltip label="Count only what you physically received. Damage swaps are limited to declared buffer stock.">
                            <span className="text-[9px] font-medium text-slate-600">Rules</span>
                          </Tooltip>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="intact" className="mb-1 block text-[9px] font-medium text-slate-400">
                              Intact units received
                            </label>
                            <QtyInput
                              id="intact"
                              min={0}
                              max={dispatch.orderQty}
                              value={intact}
                              onChange={(event) => setIntact(event.target.value)}
                              className={cn('py-2 text-sm', intactError && 'border-rose-500/60')}
                            />
                            <div className="mt-1 text-[8px] text-slate-600">of {dispatch.orderQty} ordered</div>
                          </div>
                          <div>
                            <label htmlFor="damaged" className="mb-1 block text-[9px] font-medium text-slate-400">
                              Damaged swapped
                            </label>
                            <QtyInput
                              id="damaged"
                              min={0}
                              max={dispatch.bufferQty}
                              value={damaged}
                              onChange={(event) => setDamaged(event.target.value)}
                              className={cn('py-2 text-sm', damagedError && 'border-rose-500/60')}
                            />
                            <div className="mt-1 text-[8px] text-slate-600">from {dispatch.bufferQty} buffer</div>
                          </div>
                        </div>

                        <div className="mt-1.5 flex gap-1">
                          {[0, 1, 2, 3].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setDamaged(String(Math.min(value, dispatch.bufferQty)))}
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[8px] font-semibold ring-1 ring-inset transition',
                                damagedNum === value
                                  ? 'bg-amber-400/10 text-amber-300 ring-amber-400/25'
                                  : 'text-slate-600 ring-white/[0.07] hover:text-slate-400',
                              )}
                            >
                              {value} swap
                            </button>
                          ))}
                        </div>

                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between">
                            <label htmlFor="note" className="text-[9px] font-medium text-slate-400">
                              Note / signature {damagedNum > 0 ? <span className="text-rose-400">*</span> : null}
                            </label>
                            <button
                              type="button"
                              onClick={fillSignature}
                              className="inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-400 hover:text-emerald-300"
                            >
                              <PenLine className="h-2.5 w-2.5" />
                              Sign as customer
                            </button>
                          </div>
                          <Textarea
                            id="note"
                            value={note}
                            onChange={(event) => {
                              setNote(event.target.value);
                              setError(null);
                            }}
                            placeholder={
                              damagedNum > 0
                                ? 'Required: describe the damage and authorise the buffer swap.'
                                : 'Optional delivery note for the vendor.'
                            }
                            className={cn(
                              'min-h-[54px] py-2 text-[11px]',
                              noteError && note.length > 0 && 'border-rose-500/50',
                            )}
                          />
                        </div>

                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) setProof(file.name);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="mt-2 flex w-full items-center justify-between rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition hover:border-emerald-500/30"
                        >
                          <span className="flex items-center gap-1.5 text-[9px] text-slate-500">
                            <Camera className="h-3 w-3" />
                            {proof ? <span className="truncate text-slate-300">{proof}</span> : 'Attach photo evidence (optional)'}
                          </span>
                          <span className="text-[8px] font-semibold uppercase tracking-wider text-emerald-500">
                            {proof ? 'Change' : 'Upload'}
                          </span>
                        </button>

                        <div className="mt-2.5 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2">
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-slate-500">Mandatory buffer return</span>
                            <span className="font-mono text-xs font-bold text-emerald-300">
                              {expectedReturn} units
                            </span>
                          </div>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-slate-600">
                            {dispatch.bufferQty} buffer − {damagedNum} swapped = {unusedBuffer} intact + {damagedNum} damaged
                          </p>
                        </div>

                        {error ? (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/[0.07] px-2 py-1.5 text-[9px] leading-relaxed text-rose-300">
                            <ShieldAlert className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                            {error}
                          </div>
                        ) : null}

                        <Button
                          className="mt-3 w-full"
                          size="sm"
                          disabled={!canAuthorize}
                          onClick={authorize}
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Authorize seal break &amp; confirm delivery
                        </Button>
                        <p className="mt-1.5 text-center text-[8px] leading-relaxed text-slate-600">
                          Issues a single-use unlock token. This action is irreversible.
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-center pb-2">
                  <span className="h-1 w-28 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-5 flex max-w-[400px] items-center justify-center gap-2 text-[10px] text-slate-600">
            <Lock className="h-3 w-3" />
            Simulated customer device · no app install required
          </div>
        </div>

        <div className="space-y-6 xl:col-span-6">
          <Card className="overflow-hidden border-emerald-500/15">
            <CardHeader
              title="Return calculation engine"
              subtitle="The formula is frozen the moment the customer authorises the break."
              icon={<Fingerprint className="h-4 w-4" />}
              action={
                <Badge tone={verified ? 'cyan' : 'amber'} dot>
                  {verified ? 'Contract locked' : 'Live preview'}
                </Badge>
              }
            />
            <div className="space-y-3 p-5 sm:p-6">
              <div className="space-y-2 font-mono text-xs">
                <FormulaRow label="Buffer declared at dispatch" value={dispatch.bufferQty} tone="text-slate-200" />
                <FormulaRow
                  label="Damaged units swapped by customer"
                  value={`− ${verified ? delivery!.damagedSwapped : damagedNum}`}
                  tone="text-amber-300"
                />
                <div className="h-px bg-white/[0.07]" />
                <FormulaRow
                  label="Unused buffer to return"
                  value={verified ? unusedBufferFrom(dispatch) : unusedBuffer}
                  tone="text-cyan-300"
                  strong
                />
                <FormulaRow
                  label="Damaged units returned for audit"
                  value={`+ ${verified ? delivery!.damagedSwapped : damagedNum}`}
                  tone="text-amber-300"
                />
                <div className="h-px bg-white/[0.07]" />
                <div className="flex items-end justify-between gap-4 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
                    Mandatory warehouse return
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-emerald-300">
                    {verified ? delivery!.expectedReturn : expectedReturn}
                    <span className="ml-1 text-xs font-medium text-slate-500">units</span>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <span className="font-semibold text-slate-300">Why this matters.</span> Every buffer unit is legally
                  bound to this count. A shortfall at warehouse check-in raises a Priority-1 shrinkage alert and locks
                  the driver&apos;s shift settlement. Protected stock value:{' '}
                  <span className="font-mono text-slate-300">{inr(expectedReturn * UNIT_VALUE_INR)}</span>.
                </p>
              </div>

              {verified && delivery ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-3">
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/80">
                      Single-use unlock token
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-emerald-200">
                      {delivery.unlockToken}
                    </div>
                    <div className="mt-0.5 text-[9px] text-slate-500">Consumed · {formatDateTime(delivery.confirmedAt)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(delivery.unlockToken)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                    aria-label="Copy unlock token"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Custody chain"
              subtitle="Every event is anchored to this seal."
              icon={<PackageCheck className="h-4 w-4" />}
            />
            <ol className="px-5 py-4">
              {[
                {
                  title: 'Seal issued',
                  copy: `${dispatch.sealId} generated by vendor`,
                  at: dispatch.createdAt,
                  done: true,
                  icon: Fingerprint,
                },
                {
                  title: 'Dispatched',
                  copy: `${dispatch.driverName} · ${dispatch.vehicleId}`,
                  at: dispatch.createdAt,
                  done: true,
                  icon: Truck,
                },
                {
                  title: 'Customer verification',
                  copy: verified ? 'Seal broken with consent' : 'Awaiting your confirmation',
                  at: delivery?.confirmedAt,
                  done: verified,
                  icon: Unlock,
                },
                {
                  title: 'Warehouse reconciliation',
                  copy: proofRecord
                    ? proofRecord.payoutLocked
                      ? 'Shortfall detected · payout locked'
                      : 'Return count matched'
                    : `${verified ? delivery!.expectedReturn : expectedReturn} buffer units expected back`,
                  at: proofRecord?.checkedInAt,
                  done: proofRecord !== undefined,
                  icon: ClipboardCheck,
                },
              ].map((step, index, all) => (
                <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < all.length - 1 ? (
                    <span
                      className={cn(
                        'absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px',
                        step.done ? 'bg-emerald-500/30' : 'bg-white/[0.06]',
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-slate-900',
                      step.done
                        ? 'border-emerald-500/30 text-emerald-400'
                        : 'border-white/10 text-slate-600',
                    )}
                  >
                    <step.icon className="h-3 w-3" />
                  </span>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-0.5">
                    <div className="min-w-0">
                      <div className={cn('text-xs font-semibold', step.done ? 'text-slate-200' : 'text-slate-500')}>
                        {step.title}
                      </div>
                      <div className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{step.copy}</div>
                    </div>
                    {step.at ? (
                      <span className="shrink-0 font-mono text-[9px] text-slate-600">{formatTime(step.at)}</span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                        Pending
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-4">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div className="mt-2 text-[11px] font-semibold text-slate-200">Seal integrity first</div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                Never accept a broken seal without a live token on this screen.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-4">
              <Building2 className="h-4 w-4 text-cyan-400" />
              <div className="mt-2 text-[11px] font-semibold text-slate-200">Buffer, not free stock</div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                Swaps reduce what the driver must return — but never the declared buffer total.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormulaRow({
  label,
  value,
  tone,
  strong = false,
}: {
  label: string;
  value: number | string;
  tone: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={cn('text-[10px]', strong ? 'font-semibold text-slate-300' : 'text-slate-500')}>{label}</span>
      <span className={cn('tabular-nums', tone, strong ? 'text-sm font-bold' : 'text-xs font-semibold')}>{value}</span>
    </div>
  );
}

function unusedBufferFrom(dispatch: Dispatch) {
  return dispatch.bufferQty - (dispatch.delivery?.damagedSwapped ?? 0);
}

function VerifiedState({
  dispatch,
  copied,
  onCopy,
  onAudit,
}: {
  dispatch: Dispatch;
  copied: boolean;
  onCopy: () => void;
  onAudit: () => void;
}) {
  const delivery = dispatch.delivery!;
  const route = getRoute(dispatch.routeId);
  const returned = dispatch.returnRecord;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center px-2 pb-4 pt-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-sm font-bold tracking-tight text-white">Delivery confirmed</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
          Seal {dispatch.sealId} was broken under customer consent at {formatTime(delivery.confirmedAt)}.
        </p>
        <Badge tone="emerald" dot className="mt-2">
          {dispatch.status.replaceAll('_', ' ')}
        </Badge>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-400/80">
            Unlock token · spent
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 text-[8px] font-semibold text-emerald-300"
          >
            {copied ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-1 font-mono text-xs font-semibold tracking-wide text-emerald-200">
          {delivery.unlockToken}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.05]">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-500">Core units received</span>
          <span className="font-mono text-slate-200">{delivery.intactReceived}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-500">Buffer units swapped</span>
          <span className="font-mono text-amber-300">{delivery.damagedSwapped}</span>
        </div>
        <div className="my-1 h-px bg-white/[0.07]" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-300">Return due at warehouse</span>
          <span className="font-mono text-base font-bold text-emerald-300">{delivery.expectedReturn}</span>
        </div>
        <div className="text-right font-mono text-[8px] text-slate-600">
          {dispatch.bufferQty} − {delivery.damagedSwapped} + {delivery.damagedSwapped}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/[0.06] px-2.5 py-2">
        <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-600">Attestation note</div>
        <p className="mt-0.5 whitespace-pre-line text-[10px] leading-relaxed text-slate-400">{delivery.note}</p>
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-2.5 w-2.5" /> {route.code}
        </span>
        <span className="inline-flex items-center gap-1">
          <KeyRound className="h-2.5 w-2.5" /> Single-use token
        </span>
      </div>

      {returned ? (
        <div
          className={cn(
            'mt-3 flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[9px] leading-relaxed',
            returned.payoutLocked
              ? 'border-rose-500/30 bg-rose-500/[0.08] text-rose-300'
              : 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
          )}
        >
          {returned.payoutLocked ? <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" /> : <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />}
          {returned.payoutLocked
            ? `Warehouse flagged ${returned.shortage} missing unit(s). Settlement locked.`
            : `Warehouse reconciled ${returned.intactReturned + returned.damagedReturned} units. Chain closed.`}
        </div>
      ) : (
        <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={onAudit}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          Track return in audit plane
        </Button>
      )}

      <div className="mt-3 text-center font-mono text-[8px] text-slate-600">
        {dispatch.id} · {num(dispatch.orderQty + dispatch.bufferQty)} units audited
      </div>
    </div>
  );
}
