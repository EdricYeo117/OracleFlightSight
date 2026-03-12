# OracleFlightSight

OracleFlightSight is a full-stack eye-tracking analytics platform for flight-simulator training. It captures live gaze streams from the browser, persists raw + derived telemetry in Oracle Database, and renders analytics dashboards (AOI dwell time, fixation summaries, heatmaps, and rule outcomes).

---

## Table of Contents

- [What this project does](#what-this-project-does)
- [Architecture at a glance](#architecture-at-a-glance)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
  - [1) Prerequisites](#1-prerequisites)
  - [2) Install dependencies](#2-install-dependencies)
  - [3) Configure environment variables](#3-configure-environment-variables)
  - [4) Initialize Oracle schema](#4-initialize-oracle-schema)
  - [5) Run backend](#5-run-backend)
  - [6) Run frontend](#6-run-frontend)
- [API overview](#api-overview)
- [Gaze data model (conceptual)](#gaze-data-model-conceptual)
- [Development workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing notes](#contributing-notes)

---

## What this project does

OracleFlightSight supports an operator/instructor workflow where:

1. A **training session** is created.
2. The browser captures gaze samples while the pilot uses the simulator.
3. Samples are ingested in backend batches.
4. Server-side aggregation computes AOI/heatmap/fixation metrics.
5. An analytics dashboard displays session KPIs and visual overlays.

The goal is to help teams measure attention quality and procedural scan behavior in realistic cockpit scenarios.

---

## Architecture at a glance

```text
Browser (React + WebGazer)
  └─ captures gaze samples + AOI context
     └─ POST /api/gaze/batch

Node/Express backend
  ├─ session lifecycle (/api/sessions)
  ├─ gaze ingestion + aggregation
  └─ analytics query endpoints (/api/analytics)

Oracle DB
  ├─ raw gaze samples
  ├─ fixations
  ├─ AOI visits + AOI aggregates
  ├─ rule definitions + rule results
  └─ heatmap aggregates
```

---

## Tech stack

### Frontend
- React 19 + Vite
- `@webgazer-ts/core` and `@webgazer-ts/react`
- Chart.js + react-chartjs-2

### Backend
- Node.js + Express 4
- OracleDB driver (`oracledb`)
- Pino / pino-http logging

### Data
- Oracle Database schema bootstrapped from `SIAFlightSight.sql`

---

## Repository structure

```text
.
├─ app/
│  ├─ src/                         # Frontend app code
│  │  ├─ components/
│  │  │  ├─ FlightTracking/        # Live tracking UI + overlays
│  │  │  └─ FlightAnalytics/       # Dashboard visualizations and analytics UI
│  │  ├─ services/analyticsApi.js  # Frontend analytics API client
│  │  └─ utils/                    # Gaze math, AOI mapping, smoothing, webgazer singleton
│  └─ server/
│     └─ src/
│        ├─ app.js                 # Express app wiring
│        ├─ server.js              # Startup (DB + HTTP listener)
│        ├─ routes/                # API route modules
│        ├─ services/              # Business logic + aggregation orchestration
│        ├─ controllers/           # Analytics controllers
│        ├─ db/                    # Oracle SQL model helpers
│        └─ config/                # Env, DB pool, logger
├─ SIAFlightSight.sql              # Oracle schema + setup SQL
├─ package.json                    # Frontend scripts/deps (repo root)
└─ README.md
```

---

## Getting started

### 1) Prerequisites

- Node.js 20+ recommended
- npm 10+
- Access to an Oracle Database instance
- Oracle wallet files (if your target DB requires mTLS/wallet auth)

> **Note:** Backend depends on `oracledb`, which may require Oracle Instant Client configuration depending on your OS/runtime.

### 2) Install dependencies

Install frontend dependencies from repo root:

```bash
npm install
```

Install backend dependencies:

```bash
cd app/server
npm install
```

### 3) Configure environment variables

Set these variables before starting backend (`app/server` process):

| Variable | Required | Description |
|---|---:|---|
| `ORACLE_USER` | Yes | Oracle DB username |
| `ORACLE_PASSWORD` | Yes | Oracle DB password |
| `ORACLE_CONNECT_STRING` | Yes | Oracle connect descriptor/service name |
| `ORACLE_WALLET_DIR` | Often | Path to wallet directory if wallet auth is used |
| `ORACLE_WALLET_PASSWORD` | Often | Wallet password |
| `PORT` | No | Backend port (default: `4000`) |
| `NODE_ENV` | No | Runtime mode (`development`/`production`) |

You can place these in `app/server/.env` (loaded by `dotenv`) or inject them from your shell/CI secret store.

### 4) Initialize Oracle schema

Run the SQL in `SIAFlightSight.sql` against your Oracle target schema.

This creates and/or prepares the tables used for:
- flight sessions,
- raw gaze samples,
- fixations,
- AOI visits + aggregate metrics,
- heatmap aggregates,
- AOI rules and rule results.

### 5) Run backend

From `app/server`:

```bash
npm run dev
```

Backend endpoints are exposed from:

- `http://localhost:4000/health`
- `http://localhost:4000/api/*`

### 6) Run frontend

From repository root:

```bash
npm run dev
```

Vite will print local dev URL (typically `http://localhost:5173`).

---

## API overview

Base URL: `http://localhost:4000`

### Health
- `GET /health` → `{ ok: true }`

### Session lifecycle
- `POST /api/sessions`
  - Creates a training session.
- `POST /api/sessions/:sessionId/end`
  - Finalizes ingest and marks session complete.

### Gaze ingest
- `POST /api/gaze/batch`
  - Ingests sample batch payload:

```json
{
  "sessionId": "<session-id>",
  "samples": [
    {
      "t": 1730000000000,
      "x": 0.52,
      "y": 0.61,
      "aoi": "PFD"
    }
  ]
}
```

### Analytics
- `GET /api/analytics/sessions`
  - List sessions with analytics availability.
- `GET /api/analytics/sessions/:sessionId/dashboard`
  - Dashboard summary payload for charts/tables/overlays.

---

## Gaze data model (conceptual)

A single session can produce:

- **Raw samples**: high-frequency gaze coordinates over time.
- **Fixations**: temporally grouped stable points.
- **AOI visits**: transitions and dwell intervals per cockpit region.
- **Heatmap aggregates**: spatial density bins.
- **Rule outcomes**: pass/fail checks for expected scan behavior.

This layered model supports both replay/visualization and performance scoring.

---

## Development workflow

### Frontend commands (repo root)

```bash
npm run dev        # start Vite dev server
npm run build      # production build
npm run start      # preview built app
npm run typecheck  # TypeScript type-check
```

### Backend commands (`app/server`)

```bash
npm run dev   # nodemon on src/server.js
npm start     # node src/server.js
```

---

## Troubleshooting

### Backend fails to connect to Oracle

- Verify `ORACLE_CONNECT_STRING` format/service name.
- Confirm wallet path/password if wallet is required.
- Check DB network reachability from your machine/container.
- Ensure Oracle user has privileges for objects created by `SIAFlightSight.sql`.

### `POST /api/gaze/batch` returns `400`

- Ensure `sessionId` is present.
- Ensure `samples` is a non-empty array.

### Frontend runs but no live gaze behavior

- Confirm camera permissions are granted in browser.
- Confirm WebGazer calibration flow has completed.
- Inspect browser console and backend logs for dropped batches.

---

## Contributing notes

- Keep modules small and responsibility-focused.
- Add/maintain JSDoc on public helpers and component props as interfaces evolve.
- Preserve structured logging patterns (metadata object + message).
- If you add endpoints, update this README’s API section in the same PR.
