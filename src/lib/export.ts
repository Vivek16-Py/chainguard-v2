import type { Dispatch } from '@/types';
import { getRoute } from '@/lib/constants';
import { cargoBreakdown } from '@/lib/utils';

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function exportManifestCsv(dispatches: Dispatch[]) {
  const header = [
    'Dispatch ID',
    'Seal ID',
    'Client',
    'Driver',
    'Vehicle',
    'Route',
    'Status',
    'Core Units',
    'Buffer Units',
    'Intact Delivered',
    'Buffer Swapped',
    'Expected Return',
    'Returned Intact',
    'Returned Damaged',
    'Shortage',
    'Payout Locked',
    'Created At',
  ];

  const rows = dispatches.map((dispatch) => {
    const cargo = cargoBreakdown(dispatch);
    return [
      dispatch.id,
      dispatch.sealId,
      dispatch.clientName,
      dispatch.driverName,
      dispatch.vehicleId,
      getRoute(dispatch.routeId).code,
      dispatch.status,
      dispatch.orderQty,
      dispatch.bufferQty,
      cargo.coreIntact,
      cargo.damaged,
      dispatch.delivery?.expectedReturn ?? dispatch.bufferQty,
      dispatch.returnRecord?.intactReturned ?? '',
      dispatch.returnRecord?.damagedReturned ?? '',
      dispatch.returnRecord?.shortage ?? '',
      dispatch.returnRecord?.payoutLocked ? 'YES' : 'NO',
      dispatch.createdAt,
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `chainguard-manifest-${stamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
