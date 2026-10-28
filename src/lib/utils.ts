import { clsx, type ClassValue } from 'clsx';
import { getRoute } from '@/lib/constants';
import type { Dispatch } from '@/types';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const inr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const num = (value: number) => new Intl.NumberFormat('en-IN').format(value);

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const uid = (prefix: string) => {
  const random = Math.floor(Math.random() * 0xffff).toString(16);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};

const SEAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateSealId = (existing: string[] = []) => {
  let candidate = '';
  do {
    const digits = Math.floor(1000 + Math.random() * 9000);
    const check = SEAL_ALPHABET[Math.floor(Math.random() * SEAL_ALPHABET.length)];
    candidate = `SEAL-${digits}-${check}`;
  } while (existing.includes(candidate));
  return candidate;
};

export const generateUnlockToken = () => {
  const block = () =>
    Math.floor(0x1000 + Math.random() * 0xefff)
      .toString(16)
      .toUpperCase();
  return `UNLK-${block()}-${block()}`;
};

export const gpsAnchor = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${
    lng >= 0 ? 'E' : 'W'
  }`;

export const jitterGps = (dispatch: Dispatch) => {
  const route = getRoute(dispatch.routeId);
  const drift = 0.0045;
  return gpsAnchor(
    route.base.lat + (Math.random() - 0.5) * drift,
    route.base.lng + (Math.random() - 0.5) * drift,
  );
};

export const cargoBreakdown = (dispatch: Dispatch) => {
  const coreIntact = dispatch.delivery?.intactReceived ?? dispatch.orderQty;
  const damaged = dispatch.delivery?.damagedSwapped ?? 0;
  const unusedBuffer = dispatch.bufferQty - damaged;
  const returned =
    dispatch.returnRecord !== undefined
      ? dispatch.returnRecord.intactReturned + dispatch.returnRecord.damagedReturned
      : null;
  return { coreIntact, damaged, unusedBuffer, returned };
};

export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
