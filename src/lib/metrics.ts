import { ROUTES, UNIT_VALUE_INR, getRoute } from '@/lib/constants';
import type { Dispatch } from '@/types';

export interface Metrics {
  activeDispatches: number;
  sealedEnRoute: number;
  fraudAlerts: number;
  lossSaved: number;
  reconciledCount: number;
  awaitingReturn: number;
  unitsInTransit: number;
  complianceRate: number;
}

export const computeMetrics = (dispatches: Dispatch[]): Metrics => {
  const activeDispatches = dispatches.filter(
    (d) => d.status === 'EN_ROUTE_SEALED' || d.status === 'AWAITING_RETURN',
  ).length;
  const sealedEnRoute = dispatches.filter(
    (d) => d.status === 'EN_ROUTE_SEALED' && d.sealState === 'SEALED',
  ).length;
  const fraudAlerts = dispatches.filter((d) => d.status === 'FRAUD_FLAGGED').length;
  const reconciled = dispatches.filter((d) => d.status === 'RECONCILED');
  const awaitingReturn = dispatches.filter((d) => d.status === 'AWAITING_RETURN').length;

  const lossSaved = dispatches.reduce((total, dispatch) => {
    if (!dispatch.returnRecord) return total;
    const secured =
      dispatch.returnRecord.intactReturned +
      dispatch.returnRecord.damagedReturned +
      dispatch.returnRecord.shortage;
    return total + secured * UNIT_VALUE_INR;
  }, 0);

  const completed = dispatches.filter(
    (d) => d.status === 'RECONCILED' || d.status === 'FRAUD_FLAGGED',
  ).length;
  const complianceRate = completed === 0 ? 100 : Math.round((reconciled.length / completed) * 100);

  const unitsInTransit = dispatches
    .filter((d) => d.status === 'EN_ROUTE_SEALED')
    .reduce((total, dispatch) => total + dispatch.orderQty + dispatch.bufferQty, 0);

  return {
    activeDispatches,
    sealedEnRoute,
    fraudAlerts,
    lossSaved,
    reconciledCount: reconciled.length,
    awaitingReturn,
    unitsInTransit,
    complianceRate,
  };
};

export interface DriverScore {
  name: string;
  vehicles: string[];
  runs: number;
  deliveries: number;
  incidents: number;
  deviations: number;
  shortages: number;
  trustScore: number;
  rating: 'Elite' | 'Trusted' | 'Watchlist' | 'Flagged' | 'Provisioned';
}

const ratingFor = (score: number): DriverScore['rating'] => {
  if (score >= 92) return 'Elite';
  if (score >= 78) return 'Trusted';
  if (score >= 60) return 'Watchlist';
  return 'Flagged';
};

export const buildScorecard = (dispatches: Dispatch[], rosterNames: string[] = []): DriverScore[] => {
  const names = new Set<string>([...rosterNames]);
  dispatches.forEach((dispatch) => names.add(dispatch.driverName));

  return Array.from(names)
    .map((name) => {
      const runs = dispatches.filter((dispatch) => dispatch.driverName === name);
      const deliveries = runs.filter((dispatch) => dispatch.delivery !== undefined).length;
      const incidents = runs.reduce((total, dispatch) => total + dispatch.incidents.length, 0);
      const deviations = runs.filter(
        (dispatch) =>
          dispatch.telemetry.routeStatus === 'DEVIATED' ||
          dispatch.telemetry.routeStatus === 'INCIDENT' ||
          dispatch.telemetry.routeStatus === 'STOPPED',
      ).length;
      const shortages = runs.reduce(
        (total, dispatch) => total + (dispatch.returnRecord?.shortage ?? 0),
        0,
      );
      const rawScore = 100 - shortages * 22 - incidents * 4 - deviations * 3;
      const trustScore = runs.length === 0 ? 100 : Math.max(0, Math.min(100, rawScore));
      return {
        name,
        vehicles: Array.from(new Set(runs.map((dispatch) => dispatch.vehicleId))),
        runs: runs.length,
        deliveries,
        incidents,
        deviations,
        shortages,
        trustScore,
        rating: runs.length === 0 ? 'Provisioned' : ratingFor(trustScore),
      };
    })
    .sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));
};

export const exceptionFeed = (dispatches: Dispatch[]) => {
  const incidents = dispatches.flatMap((dispatch) =>
    dispatch.incidents.map((incident) => ({
      kind: 'incident' as const,
      dispatch,
      incident,
      at: incident.timestamp,
    })),
  );
  const fraud = dispatches
    .filter((dispatch) => dispatch.returnRecord?.payoutLocked)
    .map((dispatch) => ({
      kind: 'fraud' as const,
      dispatch,
      at: dispatch.returnRecord!.checkedInAt,
    }));

  return [...fraud, ...incidents].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
};

export const routeOptions = ROUTES.map((route) => ({
  value: route.id,
  label: `${route.code} — ${route.name}`,
}));

export const routeLabel = (routeId: string) => {
  const route = getRoute(routeId);
  return `${route.code} · ${route.distanceKm} km`;
};
