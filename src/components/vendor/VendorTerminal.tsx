import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Copy,
  Fingerprint,
  IndianRupee,
  KeyRound,
  Lock,
  LockKeyhole,
  MapPin,
  PackagePlus,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  Wand2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Card';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, DispatchStatusBadge, SealBadge } from '@/components/ui/Badges';
import { Field, Input, QtyInput, Select, Textarea } from '@/components/ui/Field';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChainGuard } from '@/store/useChainGuard';
import { DRIVER_ROSTER, ROUTES, getRoute, isActive } from '@/lib/constants';
import { cn, formatDateTime, inr, num } from '@/lib/utils';
import { useCopy } from '@/hooks/useCopy';

const VEHICLE_PATTERN = /^[A-Z]{2}-\d{2}-[A-Z]{1,3}-\d{4}$/;

interface FormState {
  clientName: string;
  address: string;
  orderQty: string;
  bufferQty: string;
  driverName: string;
  vehicleId: string;
  routeId: string;
}

const emptyForm: FormState = {
  clientName: '',
  address: '',
  orderQty: '50',
  bufferQty: '10',
  driverName: '',
  vehicleId: '',
  routeId: 'R1',
};

const sampleLoad: FormState = {
  clientName: 'Zenith Retail · BKC',
  address: 'Unit 4, Ground Floor, One BKC, Bandra Kurla Complex, Mumbai 400051',
  orderQty: '50',
  bufferQty: '10',
  driverName: 'Priya Nair',
  vehicleId: 'MH-12-AB-1234',
  routeId: 'R1',
};

type Errors = Partial<Record<keyof FormState, string>>;

export function VendorTerminal() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const dispatches = useChainGuard((state) => state.dispatches);
  const lastSeal = useChainGuard((state) => state.lastSeal);
  const createDispatch = useChainGuard((state) => state.createDispatch);
  const setRole = useChainGuard((state) => state.setRole);
  const { copied, copy } = useCopy();

  const route = getRoute(form.routeId);
  const orderQty = Number(form.orderQty) || 0;
  const bufferQty = Number(form.bufferQty) || 0;
  const manifestUnits = orderQty + bufferQty;
  const activeDispatches = dispatches.filter((dispatch) => isActive(dispatch.status));

  useEffect(() => {
    if (lastSeal) {
      receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [lastSeal?.sealId]);

  const validate = (values: FormState): Errors => {
    const next: Errors = {};
    if (values.clientName.trim().length < 2) next.clientName = 'Client name is required.';
    if (values.address.trim().length < 8) next.address = 'A full delivery address is required.';
    if (!Number.isFinite(orderQty) || orderQty < 1 || orderQty > 5000)
      next.orderQty = 'Enter 1–5,000 core units.';
    if (!Number.isFinite(bufferQty) || bufferQty < 0 || bufferQty > 2000)
      next.bufferQty = 'Enter 0–2,000 buffer units.';
    if (values.driverName.trim().length < 2) next.driverName = 'Assign a driver.';
    if (!VEHICLE_PATTERN.test(values.vehicleId.trim().toUpperCase()))
      next.vehicleId = 'Use the format MH-12-AB-1234.';
    if (!ROUTES.some((item) => item.id === values.routeId)) next.routeId = 'Select a transit route.';
    return next;
  };

  const update = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (submitted) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const handleDriver = (name: string) => {
    const match = DRIVER_ROSTER.find((driver) => driver.name === name);
    setForm((previous) => ({
      ...previous,
      driverName: name,
      vehicleId: match ? match.vehicleId : previous.vehicleId,
    }));
    setErrors((previous) => ({ ...previous, driverName: undefined, vehicleId: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    createDispatch({
      clientName: form.clientName,
      address: form.address,
      orderQty,
      bufferQty,
      driverName: form.driverName,
      vehicleId: form.vehicleId.toUpperCase(),
      routeId: form.routeId,
    });

    setForm((previous) => ({
      ...emptyForm,
      routeId: previous.routeId,
      driverName: '',
      vehicleId: '',
    }));
    setSubmitted(false);
  };

  const routeEta = Math.round((route.distanceKm / 22) * 60);

  const sealedCount = useMemo(
    () => dispatches.filter((dispatch) => dispatch.sealState === 'SEALED').length,
    [dispatches],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Vendor dispatch terminal"
        title="Seal the manifest before the truck leaves the dock."
        description="Every consignment is bound to a tamper-evident digital seal, a driver, and a transit route. Buffer stock stays auditable end-to-end — no seal, no custody."
        icon={<Building2 className="h-3 w-3" />}
        actions={
          <>
            <Badge tone="emerald" dot pulse className="h-9 px-3">
              {sealedCount} seals intact
            </Badge>
            <Button variant="secondary" onClick={() => setRole('audit')}>
              <ShieldCheck className="h-4 w-4" />
              Control plane
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="overflow-hidden xl:col-span-8">
          <CardHeader
            title="Create dispatch manifest"
            subtitle="Core + buffer inventory is cryptographically locked at generation. Details cannot be edited after sealing."
            icon={<PackagePlus className="h-4 w-4" />}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setForm(sampleLoad);
                  setErrors({});
                  setSubmitted(false);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sample load
              </Button>
            }
          />

          <form onSubmit={handleSubmit} noValidate className="space-y-7 p-5 sm:p-6">
            <Section index="01" title="Consignment" hint="Who receives the load and where.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Client name"
                  required
                  htmlFor="clientName"
                  error={errors.clientName}
                  hint="Registered receiving business or customer."
                >
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                    <Input
                      id="clientName"
                      value={form.clientName}
                      onChange={(event) => update('clientName', event.target.value)}
                      placeholder="Zenith Retail · BKC"
                      className="pl-9"
                      autoComplete="organization"
                    />
                  </div>
                </Field>
                <Field
                  label="Delivery address"
                  required
                  htmlFor="address"
                  error={errors.address}
                  hint="Full landmark-enabled address for last-mile handoff."
                >
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-600" />
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(event) => update('address', event.target.value)}
                      placeholder="Unit, building, street, area, city, PIN"
                      className="min-h-[72px] pl-9"
                    />
                  </div>
                </Field>
              </div>
            </Section>

            <Section index="02" title="Inventory declaration" hint="Buffer covers customer-side damage swaps.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Base order quantity"
                  required
                  htmlFor="orderQty"
                  error={errors.orderQty}
                  hint="Units the customer has contracted to receive."
                  trailing={<span className="font-mono text-[10px] text-slate-600">CORE</span>}
                >
                  <QtyInput
                    id="orderQty"
                    min={1}
                    max={5000}
                    value={form.orderQty}
                    onChange={(event) => update('orderQty', event.target.value)}
                  />
                  <div className="mt-2 flex gap-1.5">
                    {[25, 50, 80, 120].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update('orderQty', String(value))}
                        className={cn(
                          'rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-inset transition',
                          Number(form.orderQty) === value
                            ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                            : 'text-slate-500 ring-white/[0.08] hover:text-slate-300',
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field
                  label="Buffer / extra stock"
                  required
                  htmlFor="bufferQty"
                  error={errors.bufferQty}
                  hint="Sealed contingency stock. Mandatory return at reconciliation."
                  trailing={<span className="font-mono text-[10px] text-amber-500/80">BUFFER</span>}
                >
                  <QtyInput
                    id="bufferQty"
                    min={0}
                    max={2000}
                    value={form.bufferQty}
                    onChange={(event) => update('bufferQty', event.target.value)}
                  />
                  <div className="mt-2 flex gap-1.5">
                    {[0, 5, 10, 15].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update('bufferQty', String(value))}
                        className={cn(
                          'rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-inset transition',
                          Number(form.bufferQty) === value
                            ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                            : 'text-slate-500 ring-white/[0.08] hover:text-slate-300',
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Section>

            <Section index="03" title="Chain of custody" hint="Driver, vehicle and pre-cleared route.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Assigned driver / worker"
                  required
                  htmlFor="driverName"
                  error={errors.driverName}
                  hint="Select a rostered driver or type a new name."
                >
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                    <Input
                      id="driverName"
                      list="driver-roster"
                      value={form.driverName}
                      onChange={(event) => handleDriver(event.target.value)}
                      placeholder="Priya Nair"
                      className="pl-9"
                      autoComplete="off"
                    />
                    <datalist id="driver-roster">
                      {DRIVER_ROSTER.map((driver) => (
                        <option key={driver.name} value={driver.name}>
                          {driver.vehicleId}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </Field>

                <Field
                  label="Vehicle ID"
                  required
                  htmlFor="vehicleId"
                  error={errors.vehicleId}
                  hint="Auto-filled for rostered drivers. Format: MH-12-AB-1234."
                >
                  <div className="relative">
                    <Truck className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                    <Input
                      id="vehicleId"
                      value={form.vehicleId}
                      onChange={(event) => update('vehicleId', event.target.value.toUpperCase())}
                      placeholder="MH-12-AB-1234"
                      className="pl-9 font-mono uppercase tracking-wide"
                      inputMode="text"
                    />
                  </div>
                </Field>

                <Field
                  label="Transit route"
                  required
                  htmlFor="routeId"
                  error={errors.routeId}
                  className="sm:col-span-2"
                  hint="Pre-cleared corridor with checkpoints and GPS anchors."
                >
                  <Select
                    id="routeId"
                    value={form.routeId}
                    onChange={(event) => update('routeId', event.target.value)}
                  >
                    {ROUTES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.name}
                      </option>
                    ))}
                  </Select>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <RouteIcon className="h-3 w-3 text-emerald-500" />
                      {route.checkpoints.length} checkpoints
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      {route.distanceKm} km
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="h-3 w-3 text-emerald-500" />
                      ~{routeEta} min baseline
                    </span>
                  </div>
                </Field>
              </div>
            </Section>

            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                    <Boxes className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/80">
                      Manifest preview
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">
                      {num(manifestUnits)} units · {num(orderQty)} core + {num(bufferQty)} buffer
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <IndianRupee className="h-3 w-3 text-slate-500" />
                  Declared value
                  <span className="font-mono font-semibold text-slate-200">{inr(manifestUnits * 1200)}</span>
                  <Tooltip label="Indicative buffer replacement value used by the reconciliation engine (₹1,200 / unit)." />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              <LockKeyhole className="h-4 w-4" />
              Generate tamper-proof digital seal &amp; dispatch
              <ArrowRight className="h-4 w-4 opacity-70" />
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-slate-600">
              Seal issuance is irreversible. The manifest, driver identity and route are hashed into the custody chain.
            </p>
          </form>
        </Card>

        <div className="space-y-6 xl:col-span-4">
          {lastSeal ? (
            <div ref={receiptRef} className="animate-slide-up">
              <Card className="overflow-hidden border-emerald-500/25 shadow-seal">
                <div className="relative border-b border-emerald-500/15 bg-emerald-500/[0.06] px-5 py-4">
                  <div className="pointer-events-none absolute inset-0 seal-grid opacity-40" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                      <Fingerprint className="h-3.5 w-3.5" />
                      Seal issued
                    </div>
                    <Badge tone="emerald" dot>
                      EN_ROUTE_SEALED
                    </Badge>
                  </div>
                  <div className="relative mt-3 flex items-end justify-between gap-2">
                    <div>
                      <div className="font-mono text-xl font-bold tracking-tight text-white">{lastSeal.sealId}</div>
                      <div className="mt-1 font-mono text-[10px] text-emerald-300/70">
                        {lastSeal.dispatchId} · {formatDateTime(lastSeal.createdAt)}
                      </div>
                    </div>
                    <Tooltip label={copied ? 'Copied to clipboard' : 'Copy seal ID'} side="bottom">
                      <button
                        type="button"
                        onClick={() => copy(lastSeal.sealId)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                        aria-label="Copy seal ID"
                      >
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    Cargo bay locked · history retained
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => setRole('driver')} variant="secondary">
                      <Truck className="h-3.5 w-3.5" />
                      Driver view
                    </Button>
                    <Button size="sm" onClick={() => setRole('customer')} variant="outline">
                      <KeyRound className="h-3.5 w-3.5" />
                      Simulate scan
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <CardHeader
                title="Seal protocol"
                subtitle="Four checkpoints. One immutable chain."
                icon={<Wand2 className="h-4 w-4" />}
              />
              <ol className="space-y-0 px-5 py-4">
                {[
                  {
                    title: 'Seal generated',
                    copy: 'Cryptographic seal ID bound to manifest and driver.',
                    icon: Fingerprint,
                  },
                  {
                    title: 'Cargo bay locked',
                    copy: 'Core + buffer inventory frozen at dispatch.',
                    icon: Lock,
                  },
                  {
                    title: 'Customer consent',
                    copy: 'Single-use unlock token breaks the seal.',
                    icon: KeyRound,
                  },
                  {
                    title: 'Warehouse reconcile',
                    copy: 'Exact buffer count or a settlement lock.',
                    icon: ShieldCheck,
                  },
                ].map((step, index, all) => (
                  <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < all.length - 1 ? (
                      <span className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-gradient-to-b from-emerald-500/30 to-white/[0.05]" />
                    ) : null}
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-slate-900 text-emerald-400">
                      <step.icon className="h-3 w-3" />
                    </span>
                    <div className="pt-0.5">
                      <div className="text-xs font-semibold text-slate-200">{step.title}</div>
                      <div className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{step.copy}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card>
            <CardHeader
              title="In motion"
              subtitle="Active manifests under seal."
              icon={<Truck className="h-4 w-4" />}
              action={<Badge tone="slate">{activeDispatches.length}</Badge>}
              compact
            />
            <div className="divide-y divide-white/[0.05]">
              {activeDispatches.slice(0, 4).map((dispatch) => (
                <div key={dispatch.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-200">{dispatch.clientName}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                      {dispatch.id} · {dispatch.driverName}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <DispatchStatusBadge status={dispatch.status} />
                    <span className="font-mono text-[9px] text-slate-600">{dispatch.sealId}</span>
                  </div>
                </div>
              ))}
              {activeDispatches.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-slate-500">
                  No active manifests. Generate a seal to begin.
                </div>
              ) : null}
            </div>
            <div className="border-t border-white/[0.06] px-5 py-3">
              <button
                type="button"
                onClick={() => setRole('audit')}
                className="flex w-full items-center justify-between text-[11px] font-semibold text-slate-400 transition hover:text-emerald-300"
              >
                Open full fleet manifest
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </Card>

          <Card className="border-emerald-500/10 bg-emerald-500/[0.03] p-4">
            <div className="flex items-start gap-2.5">
              <SealBadge state="SEALED" />
              <p className="text-[11px] leading-relaxed text-slate-500">
                Seals are single-use. Any break outside a customer-authorised token voids the chain and raises a
                Priority-1 tamper alert.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] font-mono text-[10px] font-semibold text-slate-400 ring-1 ring-inset ring-white/[0.06]">
          {index}
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">{title}</h3>
        <span className="hidden h-px flex-1 bg-white/[0.05] sm:block" />
        <span className="hidden text-[10px] text-slate-600 sm:block">{hint}</span>
      </div>
      {children}
    </section>
  );
}
