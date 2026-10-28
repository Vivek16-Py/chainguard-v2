# ChainGuard v2 · Last-Mile Integrity Control Plane

A production-grade, single-page React control plane for **tamper-evident last-mile logistics**: sealed dispatch, live driver telemetry, customer-authorized seal breaks, and unit-exact warehouse reconciliation with automated shrinkage detection.

The app is fully client-side, persists state to `localStorage`, and ships with a seeded fleet covering every lifecycle state — so every screen is demoable immediately.

![ChainGuard v2](https://img.shields.io/badge/ChainGuard-v2.4-10b981?style=flat-square)
![React](https://img.shields.io/badge/React-18-0ea5e9?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)

## Live demo

- **App:** https://chainguard-v2-ten.vercel.app
- **Source:** https://github.com/Vivek16-Py/chainguard-v2

## Why this exists

Last-mile shrinkage is rarely a mystery at the warehouse — it is a custody problem created earlier. ChainGuard binds every consignment to a single-use digital seal, a driver, a pre-cleared route, and a declared buffer quantity. The seal can only be broken by a customer-issued unlock token, and the exact buffer count must come back. Any variance is treated as shrinkage, raises a Priority-1 alert, and locks the driver's shift settlement.

## Four perspectives, one reactive state machine

Switch roles from the top bar. All counters, badges, manifests and scorecards update live from a single Zustand store.

### 1. Vendor Dispatch Terminal

- Full manifest form: client, address, base quantity, buffer quantity, driver, vehicle, route.
- Driver roster auto-fills the vehicle ID; vehicle format is validated (`MH-12-AB-1234`).
- **Generate tamper-proof digital seal & dispatch** issues a unique `SEAL-XXXX-X` ID and a `DSP-####` dispatch, initialises the cargo hold, and sets status `EN_ROUTE_SEALED`.
- Animated seal receipt with copy-to-clipboard, plus a live "in motion" list.
- Sample-load preset and quick quantity chips for fast demos.

### 2. Driver Telemetry & Incident Portal

- Live speed/GPS simulation pinging every 3.4 s while on route, with checkpoint progress.
- Route status controls: **On Route**, **Slightly Deviated**, **Stopped**.
- Incident beacons for **breakdown**, **pothole/cargo impact**, and **blockade**, each stamped with GPS + time and pushed to the vendor desk.
- Read-only cargo hold mirror — drivers cannot edit attested inventory.

### 3. Customer Verification Portal (simulated phone)

- Doorstep QR verification of an intact seal, with hash line and shipment summary.
- Enter intact units received and damaged units swapped from buffer.
- Note/signature is **mandatory** whenever a buffer swap occurs; optional photo evidence.
- **Authorize seal break & confirm delivery** issues a single-use unlock token, locks the return formula, and flips the dispatch to `AWAITING_RETURN`.
- Return math is frozen and shown explicitly: `(buffer − swapped) + damaged = buffer`.

### 4. Vendor Audit & Reconciliation Plane

- KPI cards: active dispatches, sealed en-route count, fraud/tamper alerts, ₹ loss saved, compliance rate.
- Live fleet & cargo manifest with per-dispatch core/buffer/damage breakdown and seal state.
- Warehouse return check-in with an automated discrepancy engine. Any non-zero variance (shortage or surplus) locks the payout and raises:

  > **CRITICAL SHRINKAGE DETECTED: Driver [Name] unaccounted for buffer units. Shift settlement payout locked.**

- Damage-attestation mismatch is surfaced separately from count variance.
- Driver reliability scorecard: runs, deliveries, incidents, route exceptions, missing units, trust score.
- Exception feed (fraud events + GPS-anchored incidents) and CSV manifest export.

## Fraud demo in 30 seconds

1. **Vendor** → *Sample load* → **Generate seal & dispatch**.
2. **Customer** → leave the seal selected → set damaged swaps to `2` → add a note → **Authorize seal break**.
3. **Audit** → Warehouse return check-in → **Simulate 2-unit shortfall** → **Complete check-in**.
4. The Priority-1 shrinkage modal appears, the payout is locked, the fleet row turns red, and the driver's trust score drops.

Use **Reset demo data** in the footer to restore the seeded fleet.

## Tech stack

- **React 18** + **TypeScript** (strict, `noUnusedLocals` / `noUnusedParameters`)
- **Vite 6** build, **Tailwind CSS 3** design system
- **Zustand** store with `persist` middleware (`localStorage` key `chainguard-v2-state`)
- **Lucide React** icons
- No backend, no API keys, no runtime secrets

## Run locally

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # typecheck + production bundle
npm run preview    # serve dist/
npm run typecheck  # tsc --noEmit
```

## Deploy

`vercel.json` pins the Vite framework, `dist` output, and an SPA rewrite. Any static host works; on Vercel, import the repo and deploy with the defaults.

```bash
npm i -g vercel
vercel --prod
```

## Project structure

```
src/
  components/
    audit/      MetricGrid, FleetTable, ReturnCheckIn, ExceptionFeed, Scorecard, AuditPlane
    customer/   CustomerPortal (simulated mobile verification)
    driver/     DriverPortal (telemetry + incident beacons)
    shell/      TopBar role switcher, background, footer, AlertModal
    ui/         Button, Card, Badges, Field, Modal, Tooltip, Toasts
    vendor/     VendorTerminal
  hooks/        useCopy
  lib/          constants, metrics/scorecard, utils, CSV export
  store/        useChainGuard (single source of truth + seeded demo data)
  types.ts      Domain model
```

## Design notes

- Dark slate/zinc surfaces, emerald success accents, crimson fraud states.
- Every button mutates real state — no dead demo controls.
- Reconciled, fraud-flagged, in-transit and awaiting-return states are all seeded.
- Keyboard-accessible dialogs, focus rings, skip link, and reduced-motion support.

## License

MIT © ChainGuard demo
