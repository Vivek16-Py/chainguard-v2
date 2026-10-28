import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRoute } from '@/lib/constants';
import {
  generateSealId,
  generateUnlockToken,
  gpsAnchor,
  jitterGps,
  uid,
} from '@/lib/utils';
import type {
  AlertPayload,
  DeliveryAttestation,
  Dispatch,
  IncidentType,
  NewDispatchInput,
  ReturnRecord,
  Role,
  RouteStatus,
  SealReceipt,
  Telemetry,
  ToastMessage,
} from '@/types';

const seedBase = Date.now();
const at = (minutesAgo: number) => new Date(seedBase - minutesAgo * 60_000).toISOString();

interface SeedOptions {
  id: string;
  sealId: string;
  clientName: string;
  address: string;
  orderQty: number;
  bufferQty: number;
  driverName: string;
  vehicleId: string;
  routeId: string;
  createdAt: string;
  routeStatus: Dispatch['telemetry']['routeStatus'];
  checkpointIndex: number;
  speedKph: number;
  status: Dispatch['status'];
  sealState: Dispatch['sealState'];
  delivery?: DeliveryAttestation;
  returnRecord?: ReturnRecord;
  incidents?: Dispatch['incidents'];
}

const buildDispatch = (options: SeedOptions): Dispatch => {
  const route = getRoute(options.routeId);
  return {
    id: options.id,
    sealId: options.sealId,
    clientName: options.clientName,
    address: options.address,
    orderQty: options.orderQty,
    bufferQty: options.bufferQty,
    driverName: options.driverName,
    vehicleId: options.vehicleId,
    routeId: options.routeId,
    createdAt: options.createdAt,
    status: options.status,
    sealState: options.sealState,
    telemetry: {
      routeStatus: options.routeStatus,
      checkpointIndex: options.checkpointIndex,
      speedKph: options.speedKph,
      gps: gpsAnchor(route.base.lat, route.base.lng),
      lastPing: at(2),
    },
    incidents: options.incidents ?? [],
  };
};

const seedDispatches = (): Dispatch[] => {
  const awaitingDelivery: DeliveryAttestation = {
    intactReceived: 40,
    damagedSwapped: 2,
    expectedReturn: 8,
    note: 'Two cartons crushed on arrival — swapped from buffer, signed by store manager.',
    unlockToken: 'UNLK-7C41-B9E2',
    confirmedAt: at(26),
  };

  const reconciledDelivery: DeliveryAttestation = {
    intactReceived: 60,
    damagedSwapped: 2,
    expectedReturn: 10,
    note: 'Signed: A. Deshmukh · client seal scan complete',
    unlockToken: 'UNLK-31FA-88C4',
    confirmedAt: at(214),
  };

  const fraudDelivery: DeliveryAttestation = {
    intactReceived: 60,
    damagedSwapped: 2,
    expectedReturn: 10,
    note: 'Signed by client · 2 damaged units swapped from buffer',
    unlockToken: 'UNLK-9D02-4E71',
    confirmedAt: at(1510),
  };

  return [
    buildDispatch({
      id: 'DSP-1042',
      sealId: 'SEAL-8921-X',
      clientName: 'Zenith Retail · BKC',
      address: 'Unit 4, Ground Floor, One BKC, Bandra Kurla Complex, Mumbai 400051',
      orderQty: 50,
      bufferQty: 10,
      driverName: 'Priya Nair',
      vehicleId: 'MH-12-AB-1234',
      routeId: 'R1',
      createdAt: at(38),
      routeStatus: 'ON_ROUTE',
      checkpointIndex: 1,
      speedKph: 42,
      status: 'EN_ROUTE_SEALED',
      sealState: 'SEALED',
    }),
    buildDispatch({
      id: 'DSP-1041',
      sealId: 'SEAL-7742-Q',
      clientName: 'Nova Diagnostics · Airoli',
      address: 'Plot 12, Airoli Logistics Park, Navi Mumbai 400708',
      orderQty: 80,
      bufferQty: 12,
      driverName: 'Imran Shaikh',
      vehicleId: 'MH-14-QC-7788',
      routeId: 'R2',
      createdAt: at(64),
      routeStatus: 'DEVIATED',
      checkpointIndex: 2,
      speedKph: 31,
      status: 'EN_ROUTE_SEALED',
      sealState: 'SEALED',
    }),
    buildDispatch({
      id: 'DSP-1040',
      sealId: 'SEAL-6608-M',
      clientName: 'Harbour Pharma · Nerul',
      address: 'Sector 21, Palm Beach Road, Nerul, Navi Mumbai 400706',
      orderQty: 120,
      bufferQty: 15,
      driverName: 'Sameer Qureshi',
      vehicleId: 'MH-43-TR-6612',
      routeId: 'R4',
      createdAt: at(22),
      routeStatus: 'INCIDENT',
      checkpointIndex: 1,
      speedKph: 0,
      status: 'EN_ROUTE_SEALED',
      sealState: 'SEALED',
      incidents: [
        {
          id: 'INC-4410',
          type: 'BREAKDOWN',
          note: 'Rear axle vibration — pulled over at Palm Beach service lane.',
          gps: '19.0742°N, 72.9971°E',
          timestamp: at(12),
          speedKph: 0,
        },
      ],
    }),
    buildDispatch({
      id: 'DSP-1039',
      sealId: 'SEAL-5183-K',
      clientName: 'Aurora Interiors · Hinjawadi',
      address: 'Phase II, Hinjawadi, Pune 411057',
      orderQty: 40,
      bufferQty: 8,
      driverName: 'Rakesh Pawar',
      vehicleId: 'MH-01-XZ-4521',
      routeId: 'R3',
      createdAt: at(122),
      routeStatus: 'ON_ROUTE',
      checkpointIndex: 3,
      speedKph: 24,
      status: 'AWAITING_RETURN',
      sealState: 'BROKEN',
      delivery: awaitingDelivery,
    }),
    buildDispatch({
      id: 'DSP-1036',
      sealId: 'SEAL-3304-B',
      clientName: 'Metro Books · Thane',
      address: 'Naupada, Thane West 400602',
      orderQty: 60,
      bufferQty: 10,
      driverName: 'Anita Deshmukh',
      vehicleId: 'MH-02-KL-9901',
      routeId: 'R1',
      createdAt: at(268),
      routeStatus: 'ON_ROUTE',
      checkpointIndex: 3,
      speedKph: 0,
      status: 'RECONCILED',
      sealState: 'RECONCILED',
      delivery: reconciledDelivery,
      returnRecord: {
        intactReturned: 8,
        damagedReturned: 2,
        expected: 10,
        shortage: 0,
        damageMismatch: false,
        payoutLocked: false,
        checkedInAt: at(96),
      },
    }),
    buildDispatch({
      id: 'DSP-1030',
      sealId: 'SEAL-2049-V',
      clientName: 'Crestline Foods · Mulund',
      address: 'LBS Marg, Mulund West, Mumbai 400080',
      orderQty: 60,
      bufferQty: 10,
      driverName: 'Rakesh Pawar',
      vehicleId: 'MH-01-XZ-4521',
      routeId: 'R2',
      createdAt: at(1600),
      routeStatus: 'ON_ROUTE',
      checkpointIndex: 3,
      speedKph: 0,
      status: 'FRAUD_FLAGGED',
      sealState: 'VOIDED',
      delivery: fraudDelivery,
      returnRecord: {
        intactReturned: 6,
        damagedReturned: 2,
        expected: 10,
        shortage: 2,
        damageMismatch: false,
        payoutLocked: true,
        checkedInAt: at(1440),
      },
    }),
  ];
};

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface ChainGuardState {
  role: Role;
  dispatches: Dispatch[];
  toasts: ToastMessage[];
  alert: AlertPayload | null;
  lastSeal: SealReceipt | null;
  setRole: (role: Role) => void;
  createDispatch: (input: NewDispatchInput) => SealReceipt;
  setRouteStatus: (id: string, status: RouteStatus) => void;
  pingTelemetry: (
    id: string,
    patch: Partial<Pick<Telemetry, 'speedKph' | 'gps' | 'checkpointIndex'>>,
  ) => void;
  advanceCheckpoint: (id: string) => void;
  logIncident: (id: string, type: IncidentType, note: string) => void;
  authorizeDelivery: (
    id: string,
    payload: { intactReceived: number; damagedSwapped: number; note: string },
  ) => DeliveryAttestation | null;
  checkInReturn: (
    id: string,
    payload: { intactReturned: number; damagedReturned: number },
  ) => ReturnRecord | null;
  dismissAlert: () => void;
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  resetDemo: () => void;
}

export const useChainGuard = create<ChainGuardState>()(
  persist(
    (set, get) => ({
      role: 'vendor',
      dispatches: seedDispatches(),
      toasts: [],
      alert: null,
      lastSeal: null,

      setRole: (role) => set({ role }),

      createDispatch: (input) => {
        const route = getRoute(input.routeId);
        const existing = get().dispatches;
        const sealId = generateSealId(existing.map((dispatch) => dispatch.sealId));
        const numericIds = existing
          .map((dispatch) => Number.parseInt(dispatch.id.replace('DSP-', ''), 10))
          .filter((value) => Number.isFinite(value));
        const nextId = `DSP-${Math.max(1042, ...numericIds) + 1}`;
        const now = new Date().toISOString();

        const dispatch: Dispatch = {
          id: nextId,
          sealId,
          clientName: input.clientName.trim(),
          address: input.address.trim(),
          orderQty: input.orderQty,
          bufferQty: input.bufferQty,
          driverName: input.driverName.trim(),
          vehicleId: input.vehicleId.trim().toUpperCase(),
          routeId: route.id,
          createdAt: now,
          status: 'EN_ROUTE_SEALED',
          sealState: 'SEALED',
          telemetry: {
            routeStatus: 'ON_ROUTE',
            checkpointIndex: 0,
            speedKph: 0,
            gps: gpsAnchor(route.base.lat, route.base.lng),
            lastPing: now,
          },
          incidents: [],
        };

        const receipt: SealReceipt = { dispatchId: nextId, sealId, createdAt: now };

        set((state) => ({
          dispatches: [dispatch, ...state.dispatches],
          lastSeal: receipt,
        }));

        get().pushToast({
          tone: 'success',
          title: `${sealId} sealed & dispatched`,
          message: `${input.orderQty} core + ${input.bufferQty} buffer units locked under ${dispatch.id}.`,
        });

        return receipt;
      },

      setRouteStatus: (id, status) => {
        set((state) => ({
          dispatches: state.dispatches.map((dispatch) =>
            dispatch.id === id
              ? {
                  ...dispatch,
                  telemetry: {
                    ...dispatch.telemetry,
                    routeStatus: status,
                    speedKph: status === 'ON_ROUTE' ? Math.max(18, dispatch.telemetry.speedKph) : 0,
                    lastPing: new Date().toISOString(),
                  },
                }
              : dispatch,
          ),
        }));

        if (status === 'DEVIATED') {
          get().pushToast({
            tone: 'warning',
            title: 'Route deviation broadcast',
            message: 'Vendor control plane notified. Deviation is logged against the manifest.',
          });
        }
      },

      pingTelemetry: (id, patch) => {
        const now = new Date().toISOString();
        set((state) => ({
          dispatches: state.dispatches.map((dispatch) =>
            dispatch.id === id
              ? { ...dispatch, telemetry: { ...dispatch.telemetry, ...patch, lastPing: now } }
              : dispatch,
          ),
        }));
      },

      advanceCheckpoint: (id) => {
        const dispatch = get().dispatches.find((item) => item.id === id);
        if (!dispatch) return;
        const route = getRoute(dispatch.routeId);
        const nextIndex = Math.min(dispatch.telemetry.checkpointIndex + 1, route.checkpoints.length - 1);
        get().pingTelemetry(id, {
          checkpointIndex: nextIndex,
          gps: jitterGps(dispatch),
          speedKph: Math.round(24 + Math.random() * 28),
        });
      },

      logIncident: (id, type, note) => {
        const dispatch = get().dispatches.find((item) => item.id === id);
        if (!dispatch) return;
        const now = new Date().toISOString();
        const incident = {
          id: uid('INC'),
          type,
          note: note.trim(),
          gps: dispatch.telemetry.gps,
          timestamp: now,
          speedKph: dispatch.telemetry.speedKph,
        };

        set((state) => ({
          dispatches: state.dispatches.map((item) =>
            item.id === id
              ? {
                  ...item,
                  incidents: [incident, ...item.incidents],
                  telemetry: {
                    ...item.telemetry,
                    routeStatus: 'INCIDENT',
                    speedKph: 0,
                    lastPing: now,
                  },
                }
              : item,
          ),
        }));

        get().pushToast({
          tone: 'danger',
          title: 'Incident beacon received',
          message: `${dispatch.driverName} · vendor desk alerted with GPS anchor and timestamp.`,
        });
      },

      authorizeDelivery: (id, payload) => {
        const dispatch = get().dispatches.find((item) => item.id === id);
        if (!dispatch || dispatch.status !== 'EN_ROUTE_SEALED' || dispatch.sealState !== 'SEALED') {
          return null;
        }
        if (payload.damagedSwapped > dispatch.bufferQty) return null;
        if (payload.intactReceived > dispatch.orderQty) return null;

        const delivery: DeliveryAttestation = {
          intactReceived: payload.intactReceived,
          damagedSwapped: payload.damagedSwapped,
          expectedReturn: dispatch.bufferQty,
          note: payload.note.trim(),
          unlockToken: generateUnlockToken(),
          confirmedAt: new Date().toISOString(),
        };

        set((state) => ({
          dispatches: state.dispatches.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'AWAITING_RETURN',
                  sealState: 'BROKEN',
                  delivery,
                  telemetry: {
                    ...item.telemetry,
                    routeStatus: 'ON_ROUTE',
                    lastPing: new Date().toISOString(),
                  },
                }
              : item,
          ),
        }));

        get().pushToast({
          tone: 'success',
          title: `Seal ${dispatch.sealId} broken with consent`,
          message: `Unlock ${delivery.unlockToken} issued · ${delivery.expectedReturn} buffer units mandated back at warehouse.`,
        });

        return delivery;
      },

      checkInReturn: (id, payload) => {
        const dispatch = get().dispatches.find((item) => item.id === id);
        if (!dispatch || dispatch.status !== 'AWAITING_RETURN' || !dispatch.delivery) return null;

        const expected = dispatch.delivery.expectedReturn;
        const received = payload.intactReturned + payload.damagedReturned;
        const discrepancy = expected - received;
        const damageMismatch = payload.damagedReturned !== dispatch.delivery.damagedSwapped;
        const fraud = discrepancy !== 0;
        const now = new Date().toISOString();

        const record: ReturnRecord = {
          intactReturned: payload.intactReturned,
          damagedReturned: payload.damagedReturned,
          expected,
          shortage: discrepancy,
          damageMismatch,
          payoutLocked: fraud,
          checkedInAt: now,
        };

        set((state) => ({
          dispatches: state.dispatches.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: fraud ? 'FRAUD_FLAGGED' : 'RECONCILED',
                  sealState: fraud ? 'VOIDED' : 'RECONCILED',
                  returnRecord: record,
                }
              : item,
          ),
          alert: fraud
            ? {
                dispatchId: dispatch.id,
                sealId: dispatch.sealId,
                driverName: dispatch.driverName,
                vehicleId: dispatch.vehicleId,
                expected,
                received,
                shortage: Math.abs(discrepancy),
                intactReturned: payload.intactReturned,
                damagedReturned: payload.damagedReturned,
                expectedDamaged: dispatch.delivery!.damagedSwapped,
              }
            : null,
        }));

        if (fraud) {
          get().pushToast({
            tone: 'danger',
            title: 'Reconciliation failed — payout locked',
            message: `${dispatch.driverName} · ${Math.abs(discrepancy)} unit(s) unaccounted for.`,
          });
        } else if (damageMismatch) {
          get().pushToast({
            tone: 'warning',
            title: 'Count reconciled with damage variance',
            message: `Returned damage (${payload.damagedReturned}) differs from customer attestation (${dispatch.delivery.damagedSwapped}). Audit note attached.`,
          });
        } else {
          get().pushToast({
            tone: 'success',
            title: `${dispatch.id} fully reconciled`,
            message: `${received}/${expected} buffer units back in the warehouse. Seal chain closed.`,
          });
        }

        return record;
      },

      dismissAlert: () => set({ alert: null }),

      pushToast: (toast) => {
        const id = uid('toast');
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        const timer = setTimeout(() => get().dismissToast(id), 6000);
        toastTimers.set(id, timer);
      },

      dismissToast: (id) => {
        const timer = toastTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          toastTimers.delete(id);
        }
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
      },

      resetDemo: () => {
        set({
          dispatches: seedDispatches(),
          role: 'vendor',
          alert: null,
          lastSeal: null,
          toasts: [],
        });
        get().pushToast({
          tone: 'info',
          title: 'Demo dataset restored',
          message: 'Six seeded dispatches reloaded across the full lifecycle.',
        });
      },
    }),
    {
      name: 'chainguard-v2-state',
      version: 1,
      partialize: (state) => ({ dispatches: state.dispatches, role: state.role }),
    },
  ),
);

export const useActiveDispatches = () =>
  useChainGuard((state) =>
    state.dispatches.filter(
      (dispatch) => dispatch.status === 'EN_ROUTE_SEALED' || dispatch.status === 'AWAITING_RETURN',
    ),
  );
