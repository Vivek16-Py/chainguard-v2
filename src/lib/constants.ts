import type { IncidentType, RouteStatus, TransitRoute } from '@/types';

export const UNIT_VALUE_INR = 1200;

export const ROUTES: TransitRoute[] = [
  {
    id: 'R1',
    code: 'MUM-CENTRAL',
    name: 'Mumbai Central → Bandra Kurla Complex',
    distanceKm: 22.4,
    checkpoints: ['Dadar Depot', 'Worli Sea Link', 'BKC Gate 2', 'Client Bay'],
    base: { lat: 19.0176, lng: 72.8562 },
  },
  {
    id: 'R2',
    code: 'THN-AIROLI',
    name: 'Thane Hub → Airoli Logistics Park',
    distanceKm: 18.1,
    checkpoints: ['Thane Hub', 'Mulund Toll', 'Airoli Bridge', 'Client Bay'],
    base: { lat: 19.2183, lng: 72.9781 },
  },
  {
    id: 'R3',
    code: 'PUNE-NORTH',
    name: 'Pune North → Hinjawadi Phase II',
    distanceKm: 26.7,
    checkpoints: ['Bhosari Yard', 'Nashik Phata', 'Wakad Junction', 'Client Bay'],
    base: { lat: 18.6279, lng: 73.8009 },
  },
  {
    id: 'R4',
    code: 'NAVI-MUMBAI',
    name: 'Vashi Depot → Nerul Client Cluster',
    distanceKm: 14.9,
    checkpoints: ['Vashi Depot', 'Palm Beach Road', 'Nerul Sector 21', 'Client Bay'],
    base: { lat: 19.0771, lng: 72.9986 },
  },
];

export const DRIVER_ROSTER = [
  { name: 'Imran Shaikh', vehicleId: 'MH-14-QC-7788' },
  { name: 'Priya Nair', vehicleId: 'MH-12-AB-1234' },
  { name: 'Rakesh Pawar', vehicleId: 'MH-01-XZ-4521' },
  { name: 'Anita Deshmukh', vehicleId: 'MH-02-KL-9901' },
  { name: 'Sameer Qureshi', vehicleId: 'MH-43-TR-6612' },
];

export const getRoute = (routeId: string): TransitRoute =>
  ROUTES.find((route) => route.id === routeId) ?? ROUTES[0];

export const ROUTE_STATUS_META: Record<
  RouteStatus,
  { label: string; tone: 'emerald' | 'amber' | 'red' | 'slate' }
> = {
  ON_ROUTE: { label: 'On Route', tone: 'emerald' },
  DEVIATED: { label: 'Slightly Deviated', tone: 'amber' },
  STOPPED: { label: 'Stopped', tone: 'slate' },
  INCIDENT: { label: 'Incident', tone: 'red' },
};

export const INCIDENT_META: Record<
  IncidentType,
  { label: string; short: string; description: string; tone: 'red' | 'amber' | 'orange' }
> = {
  BREAKDOWN: {
    label: 'Vehicle Breakdown / Mechanical Failure',
    short: 'Breakdown',
    description: 'Drivetrain, tyre or engine failure logged with a GPS anchor.',
    tone: 'red',
  },
  IMPACT: {
    label: 'Pothole / Cargo Impact Damage',
    short: 'Cargo impact',
    description: 'Road-surface impact affecting cargo integrity inside the hold.',
    tone: 'amber',
  },
  BLOCKADE: {
    label: 'Traffic / Road Blockade Delay',
    short: 'Blockade',
    description: 'Unavoidable delay caused by traffic, protest or road closure.',
    tone: 'orange',
  },
};

export const isActive = (status: string) =>
  status === 'EN_ROUTE_SEALED' || status === 'AWAITING_RETURN';
