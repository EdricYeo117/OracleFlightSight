# OracleFlightSight

OracleFlightSight is a flight-simulator analytics platform that combines a React frontend, gaze tracking overlays, and an Express + Oracle backend for ingestion and analytics.

## Project Overview

- **Frontend (`app/src`)** renders the simulator, gaze overlays, calibration tools, and analytics panels.
- **Backend (`app/server/src`)** exposes ingestion/session APIs, manages live-session state, persists gaze data, and computes aggregates.
- **Database** is Oracle; schema/bootstrap SQL is provided in `SIAFlightSight.sql`.

## Runbook

### Frontend (repo root)

```bash
npm install
npm run dev
```

### Backend (`app/server`)

```bash
cd app/server
npm install
npm run dev
```

Set Oracle connection variables in your environment (or `.env`) before starting the backend:

- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ORACLE_WALLET_DIR`
- `ORACLE_WALLET_PASSWORD`
- `PORT` (optional, defaults to `4000`)

## Architecture and File Documentation

### Frontend File Map (`app/src`)

| File | Responsibility |
|---|---|
| `main.tsx` | Frontend entrypoint; mounts React root and wraps app with `WebgazerProvider`. |
| `App.tsx` | Top-level app shell selecting the tracked simulator experience. |
| `components/FlightSimulator.jsx` | Rich standalone cockpit/instrument simulation UI and animated gauges. |
| `components/FlightAnalytics/FlightSimulatorTracked.jsx` | Main tracked simulator surface integrating gaze collection + overlays. |
| `components/FlightAnalytics/GazeDot.jsx` | Live gaze-point visualization component. |
| `components/FlightAnalytics/CalibrationOverlay.jsx` | Calibration workflow overlay for aligning eye tracking. |
| `components/FlightAnalytics/CalibrationOverlay.copy.jsx` | Alternate/snapshot calibration implementation retained for reference. |
| `components/FlightAnalytics/HeatmapOverlay.jsx` | Heatmap rendering overlay for gaze density visualization. |
| `components/FlightAnalytics/AOIOverlay.jsx` | AOI (Area of Interest) boundary/annotation overlay. |
| `components/FlightAnalytics/AnalyticsPanel.jsx` | Runtime analytics summaries and operator-facing KPIs. |
| `components/FlightAnalytics/BatchDebugPanel.jsx` | Debug tooling for inspecting batched gaze payloads and ingestion behavior. |
| `components/FlightAnalytics/FlightSimulatorTracked.copy.jsx` | Alternate/snapshot tracked simulator implementation retained for reference. |
| `utils/KalmanFilter.js` | Smoothing/filtering utility for noisy gaze signal stabilization. |
| `utils/WebGazerSingleton.js` | Singleton wrapper for WebGazer lifecycle and shared access. |
| `utils/aoiMapper.js` | Utility mapping normalized gaze coordinates to AOI labels/regions. |
| `utils/gazeMath.js` | General gaze math helpers (distance, timing, normalization helpers). |

### Backend File Map (`app/server/src`)

| File | Responsibility |
|---|---|
| `app.js` | Express app composition, middleware registration, and route mounting. |
| `server.js` | Process bootstrap: DB initialization and HTTP listener startup. |
| `config/env.js` | Environment normalization and defaulted configuration exports. |
| `config/logger.js` | Shared Pino logger configuration (pretty in non-prod). |
| `config/db.js` | Oracle pool lifecycle and connection acquisition helpers. |
| `middleware/requestLogger.js` | Per-request logger scoping and HTTP request telemetry. |
| `routes/sessionRoutes.js` | Session lifecycle routes (create/end/finalize operations). |
| `routes/gazeRoutes.js` | Gaze ingestion routes (batch receipt and validation). |
| `controllers/sessionController.js` | Session controller layer for request orchestration. |
| `controllers/gazeController.js` | Gaze controller layer for ingestion orchestration. |
| `services/sessionService.js` | Session-focused business logic and data flow coordination. |
| `services/gazeIngestService.js` | Batch ingest pipeline: validation, persistence, and aggregation triggers. |
| `services/aggregateService.js` | Cross-model aggregation orchestration for AOI/heatmap/fixation metrics. |
| `state/liveSessionState.js` | In-memory live-session tracking/state registry. |
| `db/flightSessionModel.js` | SQL access for flight-session CRUD/finalization operations. |
| `db/gazeSampleModel.js` | SQL bulk insert/read helpers for raw gaze samples. |
| `db/gazeFixationModel.js` | SQL helpers for fixation-level derived data. |
| `db/aoiRuleModel.js` | SQL helpers for AOI rule definitions and retrieval. |
| `db/aoiRuleResultModel.js` | SQL helpers for persisted AOI rule evaluation outcomes. |
| `db/aoiAggregateModel.js` | SQL helpers for AOI aggregate/statistical rollups. |
| `db/heatmapAggregateModel.js` | SQL helpers for per-cell heatmap aggregate upserts. |

## Documentation Conventions Added

- Source files in frontend/backend now include a file-level documentation block describing:
  - module identity and layer,
  - purpose and maintainability expectations,
  - where to add deeper JSDoc when interfaces evolve.
- This README now serves as the canonical “file responsibility map” so contributors can quickly find the right extension point.

## Database

- Oracle schema and setup scripts are provided in `SIAFlightSight.sql`.

## Notes for Contributors

- Keep file-level headers accurate when ownership/responsibilities shift.
- Prefer small, testable helper functions with JSDoc on exported APIs.
- Keep request/DB logs structured (objects first, message second).
