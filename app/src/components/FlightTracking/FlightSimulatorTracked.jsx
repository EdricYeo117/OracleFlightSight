/**
 * Module: app/src/components/FlightAnalytics/FlightSimulatorTracked.jsx
 * Layer: Frontend
 * Purpose:
 * - Implements the FlightSimulatorTracked unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useWebgazer,
  useCalibration,
  useGazeTracking,
} from "@webgazer-ts/react";

import FlightSimulator from "../FlightSimulator";
import KalmanFilter from "../../utils/KalmanFilter";
import {
  viewportToLocal,
  isInsideRect,
  normalizePoint,
  pointToGridCell,
} from "../../utils/gazeMath";
import {
  DEFAULT_AOIS,
  resolveAOIRects,
  mapPointToAOI,
} from "../../utils/aoiMapper";
import CalibrationOverlay from "./CalibrationOverlay";
import AOIOverlay from "./AOIOverlay";
import HeatmapOverlay from "./HeatmapOverlay";
import GazeDot from "./GazeDot";
import BatchDebugPanel from "./BatchDebugPanel";

const GRID_COLS = 40;
const GRID_ROWS = 24;
const BATCH_INTERVAL_MS = 800;
const MAX_BUFFER_SIZE = 40;
const MIN_BATCH_SIZE = 5;

const EDGE_MARGIN = 16;
const MAX_JUMP_PX = 220;
const MIN_SAMPLE_INTERVAL_MS = 60;
const EWMA_ALPHA = 0.22;
const AOI_CONFIRM_SAMPLES = 3;
const MIN_CONFIDENCE = 0.5;
const MIN_VISIT_MS = 120;

function formatZulu(date = new Date()) {
  return date.toUTCString().slice(17, 25);
}

function formatMsAsSeconds(ms = 0) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0.00s";
  }

  return `${(ms / 1000).toFixed(2)}s`;
}

function TrackingStatusStrip({
  isReady,
  isCalibrated,
  isTracking,
  currentAOI,
}) {
  const [zulu, setZulu] = useState(formatZulu());

  useEffect(() => {
    const timer = setInterval(() => setZulu(formatZulu()), 1000);
    return () => clearInterval(timer);
  }, []);

  const trackingState = !isReady
    ? "EYE TRACKING OFFLINE"
    : !isCalibrated
      ? "CALIBRATION REQUIRED"
      : isTracking
        ? "ATTENTION TRACKING ACTIVE"
        : "TRACKING STANDBY";

  const trackingColor = !isReady
    ? "#ff6b7a"
    : !isCalibrated
      ? "#ffb84d"
      : isTracking
        ? "#7cffb2"
        : "#7fd6ff";

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 18,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        border: "1px solid rgba(200,164,77,0.16)",
        borderRadius: 16,
        background: "rgba(6,23,43,0.58)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border: `1px solid ${trackingColor}55`,
          color: trackingColor,
          fontFamily: "Orbitron, monospace",
          fontSize: 10,
          letterSpacing: 1.4,
          background: "rgba(255,255,255,0.03)",
          whiteSpace: "nowrap",
        }}
      >
        {trackingState}
      </div>

      <div
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid rgba(127,214,255,0.34)",
          color: "#7fd6ff",
          fontFamily: "Orbitron, monospace",
          fontSize: 10,
          letterSpacing: 1.6,
          background: "rgba(255,255,255,0.03)",
          whiteSpace: "nowrap",
        }}
      >
        ACTIVE AOI · {currentAOI}
      </div>

      <div
        style={{
          minWidth: 84,
          textAlign: "right",
          paddingLeft: 4,
        }}
      >
        <div
          style={{
            fontFamily: "Orbitron, monospace",
            fontSize: 15,
            color: "#c8a44d",
            letterSpacing: 1.2,
            lineHeight: 1.1,
          }}
        >
          {zulu}
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 1.6,
            color: "rgba(238,244,251,0.5)",
          }}
        >
          UTC · ZULU
        </div>
      </div>
    </div>
  );
}

function ControlDock({
  isReady,
  isCalibrated,
  isTracking,
  showAOIOverlay,
  showHeatmap,
  showDebugPanel,
  onStart,
  onStop,
  onReset,
  onRecalibrate,
  onBeginCalibration,
  onToggleAOI,
  onToggleHeatmap,
  onToggleDebug,
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 14,
        bottom: 14,
        zIndex: 40,
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        maxWidth: "calc(100% - 28px)",
      }}
    >
      <button
        onClick={onStart}
        disabled={!isReady || !isCalibrated || isTracking}
        style={btnStyle("#7cffb2", !isReady || !isCalibrated || isTracking)}
      >
        Start Tracking
      </button>

      <button
        onClick={onStop}
        disabled={!isTracking}
        style={btnStyle("#ffb84d", !isTracking)}
      >
        Stop Tracking
      </button>

      <button onClick={onReset} style={btnStyle("#7fd6ff", false)}>
        Reset Session
      </button>

      <button
        onClick={isCalibrated ? onRecalibrate : onBeginCalibration}
        style={btnStyle("#c8a44d", false)}
      >
        {isCalibrated ? "Recalibrate" : "Begin Calibration"}
      </button>

      <button onClick={onToggleAOI} style={btnStyle("#7fd6ff", false)}>
        {showAOIOverlay ? "Hide AOIs" : "Show AOIs"}
      </button>

      <button onClick={onToggleHeatmap} style={btnStyle("#ffb84d", false)}>
        {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
      </button>

      <button onClick={onToggleDebug} style={btnStyle("#c8a44d", false)}>
        {showDebugPanel ? "Hide Debug" : "Show Debug"}
      </button>
    </div>
  );
}

function SessionStats({
  sampleCount,
  liveObjectStats,
  sessionId,
  currentAOI,
  currentObjectDwellMs,
}) {
  const sortedAOIs = Object.entries(liveObjectStats)
    .sort((a, b) => b[1].totalDwellMs - a[1].totalDwellMs)
    .slice(0, 5);

  return (
    <div
      style={{
        position: "absolute",
        top: 74,
        right: 18,
        zIndex: 40,
        width: 300,
        borderRadius: 18,
        border: "1px solid rgba(200,164,77,0.14)",
        background: "rgba(6,23,43,0.42)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(200,164,77,0.12)",
          background:
            "linear-gradient(90deg, rgba(200,164,77,0.08), rgba(200,164,77,0.02))",
          fontFamily: "Orbitron, monospace",
          fontSize: 11,
          letterSpacing: 1.6,
          color: "#f2e3b0",
        }}
      >
        Crew Attention Summary
      </div>

      <div style={{ padding: 12, display: "grid", gap: 8 }}>
        <StatRow
          label="Session ID"
          value={sessionId}
          color="#7fd6ff"
          mono
          small
        />
        <StatRow
          label="Buffered Samples"
          value={String(sampleCount)}
          color="#7cffb2"
          mono
        />
        <StatRow
          label="Current Object"
          value={currentAOI}
          color="#ffb84d"
          mono
        />
        <StatRow
          label="Current Dwell"
          value={
            currentAOI === "NONE"
              ? "0.00s"
              : formatMsAsSeconds(currentObjectDwellMs)
          }
          color="#c8a44d"
          mono
        />

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 10,
          }}
        >
          <div
            style={{
              marginBottom: 8,
              color: "rgba(238,244,251,0.55)",
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            Top Focus Objects
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            {sortedAOIs.length ? (
              sortedAOIs.map(([name, stats]) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.045)",
                  }}
                >
                  <div>
                    <div style={{ color: "#eef4fb", fontSize: 13 }}>{name}</div>
                    <div
                      style={{
                        color: "rgba(238,244,251,0.45)",
                        fontSize: 11,
                      }}
                    >
                      {stats.visitCount} visits
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "#7fd6ff",
                        fontFamily: "Orbitron, monospace",
                        fontSize: 12,
                      }}
                    >
                      {formatMsAsSeconds(stats.totalDwellMs)}
                    </div>
                    <div
                      style={{
                        color: "rgba(238,244,251,0.45)",
                        fontSize: 11,
                      }}
                    >
                      max {formatMsAsSeconds(stats.longestVisitMs)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "rgba(238,244,251,0.45)", fontSize: 13 }}>
                No object visits yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color, mono = false, small = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 10px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          color: "rgba(238,244,251,0.52)",
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color,
          fontFamily: mono ? "Orbitron, monospace" : "Rajdhani, sans-serif",
          fontSize: small ? 10 : 12,
          textAlign: "right",
          maxWidth: 170,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function btnStyle(color, disabled) {
  return {
    padding: "10px 14px",
    borderRadius: 999,
    border: `1px solid ${disabled ? "rgba(255,255,255,0.14)" : color}`,
    background: disabled ? "rgba(255,255,255,0.04)" : "rgba(6,23,43,0.9)",
    color: disabled ? "rgba(255,255,255,0.35)" : color,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "Orbitron, monospace",
    fontSize: 10,
    letterSpacing: 1.5,
    boxShadow: disabled ? "none" : `0 0 0 1px ${color}10 inset`,
  };
}

export default function FlightSimulatorTracked() {
  const rootRef = useRef(null);
  const backendSessionIdRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const sessionIdRef = useRef(`flight_${Date.now()}`);
  const filterXRef = useRef(new KalmanFilter());
  const filterYRef = useRef(new KalmanFilter());
  const lastAcceptedRef = useRef(null);
  const smoothedRef = useRef(null);

  const lastSampleTsRef = useRef(0);
  const aoiStabilityRef = useRef({
    candidate: "NONE",
    count: 0,
    active: "NONE",
  });
  const ignoreUntilRef = useRef(0);

  const activeAoiSinceRef = useRef(null);
  const lastStableAoiRef = useRef("NONE");

  const [bounds, setBounds] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [showAOIOverlay, setShowAOIOverlay] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCalibrationOverlay, setShowCalibrationOverlay] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const [gazePoint, setGazePoint] = useState(null);
  const [heatmapMap, setHeatmapMap] = useState({});
  const [sampleBuffer, setSampleBuffer] = useState([]);
  const [lastBatch, setLastBatch] = useState(null);
  const [currentAOI, setCurrentAOI] = useState("NONE");
  const [liveObjectStats, setLiveObjectStats] = useState({});
  const [currentObjectDwellMs, setCurrentObjectDwellMs] = useState(0);

  const flushIntervalRef = useRef(null);
  const isStoppingRef = useRef(false);
  const webgazer = useWebgazer();
  const calibration = useCalibration();
  const gaze = useGazeTracking();
  const isReady = !!webgazer;

  async function startBackendSession(currentBounds) {
    const res = await fetch("http://localhost:4000/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "sia-a350-flight-analytics",
        pilotId: "local-user",
        screenWidth: currentBounds.width,
        screenHeight: currentBounds.height,
        gridCols: GRID_COLS,
        gridRows: GRID_ROWS,
        notes: "Oracle flight simulator eye tracking session",
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create backend session: ${res.status}`);
    }

    const data = await res.json();
    backendSessionIdRef.current = data.sessionId;
    sessionIdRef.current = data.sessionId;
    sessionStartRef.current = Date.now();
  }

  async function flushSamplesNow(samples) {
    if (!samples?.length || !backendSessionIdRef.current) return;

    const payload = {
      sessionId: backendSessionIdRef.current,
      samples,
    };

    const r = await fetch("http://localhost:4000/api/gaze/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Batch POST failed: ${r.status} ${text}`);
    }

    const data = await r.json();
    setLastBatch(data);
  }

  function smoothPoint(point) {
    const prev = smoothedRef.current;
    if (!prev) {
      smoothedRef.current = point;
      return point;
    }

    const next = {
      x: prev.x + EWMA_ALPHA * (point.x - prev.x),
      y: prev.y + EWMA_ALPHA * (point.y - prev.y),
    };
    smoothedRef.current = next;
    return next;
  }

  function shouldAcceptPoint(point, rect) {
    if (
      point.x < EDGE_MARGIN ||
      point.y < EDGE_MARGIN ||
      point.x > rect.width - EDGE_MARGIN ||
      point.y > rect.height - EDGE_MARGIN
    ) {
      return false;
    }

    const last = lastAcceptedRef.current;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_JUMP_PX) return false;
    }

    return true;
  }

  function stableAOI(nextAoi) {
    const state = aoiStabilityRef.current;

    if (nextAoi === state.active) {
      state.candidate = nextAoi;
      state.count = 0;
      return state.active;
    }

    if (nextAoi === state.candidate) {
      state.count += 1;
    } else {
      state.candidate = nextAoi;
      state.count = 1;
    }

    if (state.count >= AOI_CONFIRM_SAMPLES) {
      state.active = nextAoi;
      state.count = 0;
    }

    return state.active;
  }

  function commitAoiVisit(aoi, startTs, endTs) {
    if (!aoi || aoi === "NONE" || startTs == null || endTs == null) return;

    const durationMs = Math.max(0, endTs - startTs);
    if (durationMs < MIN_VISIT_MS) return;

    setLiveObjectStats((prev) => {
      const existing = prev[aoi] || {
        visitCount: 0,
        totalDwellMs: 0,
        longestVisitMs: 0,
        lastStartTsMs: null,
        lastEndTsMs: null,
      };

      return {
        ...prev,
        [aoi]: {
          ...existing,
          visitCount: existing.visitCount + 1,
          totalDwellMs: existing.totalDwellMs + durationMs,
          longestVisitMs: Math.max(existing.longestVisitMs, durationMs),
          lastStartTsMs: startTs,
          lastEndTsMs: endTs,
        },
      };
    });
  }

  function handleAoiTransition(nextAoi, now) {
    const currentStableAoi = lastStableAoiRef.current;

    if (nextAoi === currentStableAoi) {
      if (activeAoiSinceRef.current != null && nextAoi !== "NONE") {
        setCurrentObjectDwellMs(now - activeAoiSinceRef.current);
      } else {
        setCurrentObjectDwellMs(0);
      }
      return;
    }

    if (currentStableAoi !== "NONE" && activeAoiSinceRef.current != null) {
      commitAoiVisit(currentStableAoi, activeAoiSinceRef.current, now);
    }

    lastStableAoiRef.current = nextAoi;
    activeAoiSinceRef.current = nextAoi === "NONE" ? null : now;
    setCurrentObjectDwellMs(0);
  }

  useEffect(() => {
    const measure = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      setBounds({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const handlePointerDown = () => {
      ignoreUntilRef.current = Date.now() + 700;
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const resolvedAOIs = useMemo(() => {
    if (!bounds) return [];
    return resolveAOIRects(DEFAULT_AOIS, bounds);
  }, [bounds]);

  useEffect(() => {
    if (!isTracking || !bounds || !gaze || !rootRef.current) return;

    const gazeX = gaze.x ?? gaze.screenX ?? gaze.clientX;
    const gazeY = gaze.y ?? gaze.screenY ?? gaze.clientY;

    if (typeof gazeX !== "number" || typeof gazeY !== "number") return;

    if (
      typeof gaze.confidence === "number" &&
      gaze.confidence < MIN_CONFIDENCE
    ) {
      return;
    }

    const now = Date.now();
    if (now < ignoreUntilRef.current) return;
    if (now - lastSampleTsRef.current < MIN_SAMPLE_INTERVAL_MS) return;
    lastSampleTsRef.current = now;

    const rect = rootRef.current.getBoundingClientRect();
    const local = viewportToLocal(gazeX, gazeY, rect);

    if (!isInsideRect(local.x, local.y, rect)) return;

    const kalmanPoint = {
      x: Math.max(0, Math.min(rect.width, filterXRef.current.filter(local.x))),
      y: Math.max(0, Math.min(rect.height, filterYRef.current.filter(local.y))),
    };

    const filteredPoint = smoothPoint(kalmanPoint);

    if (!shouldAcceptPoint(filteredPoint, rect)) return;

    lastAcceptedRef.current = filteredPoint;
    setGazePoint(filteredPoint);

    const rawAoi = mapPointToAOI(
      filteredPoint.x,
      filteredPoint.y,
      resolvedAOIs,
    );
    const aoiId = stableAOI(rawAoi);

    setCurrentAOI(aoiId);
    handleAoiTransition(aoiId, now);

    const { gx, gy } = pointToGridCell(
      filteredPoint.x,
      filteredPoint.y,
      rect.width,
      rect.height,
      GRID_COLS,
      GRID_ROWS,
    );

    const key = `${gx}:${gy}`;

    setHeatmapMap((prev) => ({
      ...prev,
      [key]: {
        gx,
        gy,
        value: (prev[key]?.value || 0) + 1,
      },
    }));

    const { nx, ny } = normalizePoint(filteredPoint.x, filteredPoint.y, rect);

    const sample = {
      sessionId: backendSessionIdRef.current || sessionIdRef.current,
      tsMs: now,
      elapsedMs: now - sessionStartRef.current,
      x: Number(filteredPoint.x.toFixed(2)),
      y: Number(filteredPoint.y.toFixed(2)),
      nx: Number(nx.toFixed(4)),
      ny: Number(ny.toFixed(4)),
      aoi: aoiId,
      confidence: typeof gaze.confidence === "number" ? gaze.confidence : 1,
      gridX: gx,
      gridY: gy,
      isValid: 1,
      invalidReason: null,
    };

    setSampleBuffer((prev) => {
      const next = [...prev, sample];
      return next.length > MAX_BUFFER_SIZE
        ? next.slice(next.length - MAX_BUFFER_SIZE)
        : next;
    });
  }, [isTracking, bounds, gaze, resolvedAOIs]);

  useEffect(() => {
    if (!isTracking) {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      return;
    }

    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }

    flushIntervalRef.current = setInterval(() => {
      setSampleBuffer((prev) => {
        if (prev.length < MIN_BATCH_SIZE) return prev;
        if (!backendSessionIdRef.current) return prev;

        const payload = {
          sessionId: backendSessionIdRef.current,
          samples: prev,
        };

        fetch("http://localhost:4000/api/gaze/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(async (r) => {
            if (!r.ok) {
              const text = await r.text();
              throw new Error(`Batch POST failed: ${r.status} ${text}`);
            }
            return r.json();
          })
          .then((data) => {
            setLastBatch(data);
          })
          .catch((err) => {
            console.error("Failed to flush gaze batch:", err);
          });

        return [];
      });
    }, BATCH_INTERVAL_MS);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
    };
  }, [isTracking]);

  const heatmapCells = useMemo(() => Object.values(heatmapMap), [heatmapMap]);

  const handleStartTracking = async () => {
    filterXRef.current.reset();
    filterYRef.current.reset();
    smoothedRef.current = null;
    lastAcceptedRef.current = null;
    lastSampleTsRef.current = 0;
    aoiStabilityRef.current = { candidate: "NONE", count: 0, active: "NONE" };
    activeAoiSinceRef.current = null;
    lastStableAoiRef.current = "NONE";
    setCurrentObjectDwellMs(0);

    try {
      if (!bounds) {
        throw new Error("Simulator bounds not ready");
      }

      if (!backendSessionIdRef.current) {
        await startBackendSession(bounds);
      }

      if (webgazer?.start) {
        await webgazer.start();
      } else if (webgazer?.begin) {
        await webgazer.begin();
      } else if (webgazer?.resume) {
        await webgazer.resume();
      }

      if (webgazer?.showPredictionPoints) {
        webgazer.showPredictionPoints(false);
      }

      setIsTracking(true);
    } catch (err) {
      console.error("Failed to start tracking:", err);
      alert(`Failed to start tracking: ${err?.message || err}`);
    }
  };

  const handleStopTracking = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }

      const now = Date.now();
      if (
        lastStableAoiRef.current !== "NONE" &&
        activeAoiSinceRef.current != null
      ) {
        commitAoiVisit(
          lastStableAoiRef.current,
          activeAoiSinceRef.current,
          now,
        );
      }
      lastStableAoiRef.current = "NONE";
      activeAoiSinceRef.current = null;
      setCurrentObjectDwellMs(0);

      if (webgazer?.pause) {
        await webgazer.pause();
      }

      const remaining = sampleBuffer;
      if (remaining.length) {
        await flushSamplesNow(remaining);
        setSampleBuffer([]);
      }

      if (backendSessionIdRef.current) {
        await fetch(
          `http://localhost:4000/api/sessions/${backendSessionIdRef.current}/end`,
          { method: "POST" },
        );
      }
    } catch (err) {
      console.error("Failed to stop tracking cleanly:", err);
    } finally {
      setIsTracking(false);
      backendSessionIdRef.current = null;
      isStoppingRef.current = false;
    }
  };

  const handleResetSession = () => {
    sessionIdRef.current = `flight_${Date.now()}`;
    backendSessionIdRef.current = null;
    sessionStartRef.current = Date.now();

    setHeatmapMap({});
    setSampleBuffer([]);
    setLastBatch(null);
    setGazePoint(null);
    setCurrentAOI("NONE");
    setLiveObjectStats({});
    setCurrentObjectDwellMs(0);

    filterXRef.current.reset();
    filterYRef.current.reset();
    smoothedRef.current = null;
    lastAcceptedRef.current = null;
    lastSampleTsRef.current = 0;
    aoiStabilityRef.current = { candidate: "NONE", count: 0, active: "NONE" };
    activeAoiSinceRef.current = null;
    lastStableAoiRef.current = "NONE";
  };

  const handleRecalibrate = async () => {
    try {
      await calibration?.reset?.();
      if (window.webgazer?.clearData) {
        window.webgazer.clearData();
      }
      window.localStorage.removeItem("webgazerGlobalData");
    } finally {
      setIsCalibrated(false);
      setIsTracking(false);
      setGazePoint(null);
      setCurrentAOI("NONE");
      setCurrentObjectDwellMs(0);
      smoothedRef.current = null;
      lastAcceptedRef.current = null;
      lastSampleTsRef.current = 0;
      ignoreUntilRef.current = Date.now() + 700;
      aoiStabilityRef.current = { candidate: "NONE", count: 0, active: "NONE" };
      activeAoiSinceRef.current = null;
      lastStableAoiRef.current = "NONE";
      setShowCalibrationOverlay(true);
    }
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top, rgba(10,33,66,0.35), transparent 35%), linear-gradient(180deg, #020913 0%, #06172b 45%, #030a12 100%)",
      }}
    >
      <FlightSimulator />

      <TrackingStatusStrip
        isReady={isReady}
        isCalibrated={isCalibrated}
        isTracking={isTracking}
        currentAOI={currentAOI}
      />

      <SessionStats
        sampleCount={sampleBuffer.length}
        liveObjectStats={liveObjectStats}
        sessionId={sessionIdRef.current}
        currentAOI={currentAOI}
        currentObjectDwellMs={currentObjectDwellMs}
      />

      <ControlDock
        isReady={isReady}
        isCalibrated={isCalibrated}
        isTracking={isTracking}
        showAOIOverlay={showAOIOverlay}
        showHeatmap={showHeatmap}
        showDebugPanel={showDebugPanel}
        onStart={handleStartTracking}
        onStop={handleStopTracking}
        onReset={handleResetSession}
        onRecalibrate={handleRecalibrate}
        onBeginCalibration={() => setShowCalibrationOverlay(true)}
        onToggleAOI={() => setShowAOIOverlay((v) => !v)}
        onToggleHeatmap={() => setShowHeatmap((v) => !v)}
        onToggleDebug={() => setShowDebugPanel((v) => !v)}
      />

      {bounds && showAOIOverlay && <AOIOverlay aois={resolvedAOIs} />}

      {bounds && showHeatmap && (
        <HeatmapOverlay
          bounds={bounds}
          cols={GRID_COLS}
          rows={GRID_ROWS}
          cells={heatmapCells}
          visible={showHeatmap}
        />
      )}

      {gazePoint && <GazeDot point={gazePoint} />}

      {bounds && isReady && showCalibrationOverlay && !isCalibrated && (
       <CalibrationOverlay
  bounds={bounds}
  title="Singapore Airlines Crew Attention Calibration"
  subtitle="Keep your head still and follow each highlighted point."
  randomCount={5}
  settleMs={700}
  samplesPerTarget={4}
  sampleIntervalMs={120}
onRecordPoint={async (x, y) => {
  for (let i = 0; i < 4; i += 1) {
    if (window.webgazer?.recordScreenPosition) {
      window.webgazer.recordScreenPosition(x, y, "click");
    }

    if (calibration?.recordPoint) {
      try {
        await calibration.recordPoint(x, y);
      } catch (err) {
        console.warn("calibration.recordPoint failed:", err);
      }
    }

    if (i < 3) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }
}}
  onComplete={async () => {
    try {
      await calibration?.complete?.();
    } catch (err) {
      console.warn("Calibration completion reported an issue:", err);
    } finally {
      ignoreUntilRef.current = Date.now() + 800;
      setTimeout(() => {
        lastAcceptedRef.current = null;
        smoothedRef.current = null;
        lastSampleTsRef.current = 0;
        filterXRef.current.reset();
        filterYRef.current.reset();
        setGazePoint(null);
        setCurrentAOI("NONE");
        setCurrentObjectDwellMs(0);
        setIsCalibrated(true);
        setShowCalibrationOverlay(false);
      }, 800);
    }
  }}
/>
      )}

      {showDebugPanel && (
        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
            zIndex: 40,
            width: 360,
            maxWidth: "calc(100vw - 28px)",
          }}
        >
          <BatchDebugPanel
            isTracking={isTracking}
            currentAOI={currentAOI}
            sampleBufferCount={sampleBuffer.length}
            lastBatch={lastBatch}
            aoiCounts={Object.fromEntries(
              Object.entries(liveObjectStats).map(([key, stats]) => [
                key,
                stats.visitCount,
              ]),
            )}
          />
        </div>
      )}
    </div>
  );
}
