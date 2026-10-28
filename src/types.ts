export type Role = 'vendor' | 'driver' | 'customer' | 'audit';

export type DispatchStatus =
  | 'EN_ROUTE_SEALED'
  | 'AWAITING_RETURN'
  | 'RECONCILED'
  | 'FRAUD_FLAGGED';

export type SealState = 'SEALED' | 'BROKEN' | 'RECONCILED' | 'VOIDED';

export type RouteStatus = 'ON_ROUTE' | 'DEVIATED' | 'STOPPED' | 'INCIDENT';

export type IncidentType = 'BREAKDOWN' | 'IMPACT' | 'BLOCKADE';

export interface Incident {
  id: string;
  type: IncidentType;
  note: string;
  gps: string;
  timestamp: string;
  speedKph: number;
}

export interface Telemetry {
  routeStatus: RouteStatus;
  checkpointIndex: number;
  speedKph: number;
  gps: string;
  lastPing: string;
}

export interface DeliveryAttestation {
  intactReceived: number;
  damagedSwapped: number;
  expectedReturn: number;
  note: string;
  unlockToken: string;
  confirmedAt: string;
}

export interface ReturnRecord {
  intactReturned: number;
  damagedReturned: number;
  expected: number;
  shortage: number;
  damageMismatch: boolean;
  payoutLocked: boolean;
  checkedInAt: string;
}

export interface Dispatch {
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
  status: DispatchStatus;
  sealState: SealState;
  telemetry: Telemetry;
  incidents: Incident[];
  delivery?: DeliveryAttestation;
  returnRecord?: ReturnRecord;
}

export interface TransitRoute {
  id: string;
  code: string;
  name: string;
  distanceKm: number;
  checkpoints: string[];
  base: { lat: number; lng: number };
}

export interface NewDispatchInput {
  clientName: string;
  address: string;
  orderQty: number;
  bufferQty: number;
  driverName: string;
  vehicleId: string;
  routeId: string;
}

export interface AlertPayload {
  dispatchId: string;
  sealId: string;
  driverName: string;
  vehicleId: string;
  expected: number;
  received: number;
  shortage: number;
  intactReturned: number;
  damagedReturned: number;
  expectedDamaged: number;
}

export interface ToastMessage {
  id: string;
  tone: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface SealReceipt {
  dispatchId: string;
  sealId: string;
  createdAt: string;
}
