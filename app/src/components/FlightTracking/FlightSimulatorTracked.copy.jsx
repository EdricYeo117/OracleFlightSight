import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useWebgazer,
  useGazeTracking,
  useCalibration,
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

function formatZulu(date = new Date()) {
  return date.toUTCString().slice(17, 25);
}

function BrandHeader({ isReady, isCalibrated, isTracking, currentAOI }) {
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
        top: 14,
        left: 14,
        right: 14,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        border: "1px solid rgba(200,164,77,0.28)",
        borderRadius: 14,
        background:
          "linear-gradient(90deg, rgba(6,23,43,0.94), rgba(10,33,66,0.94), rgba(6,23,43,0.94))",
        boxShadow: "0 10px 26px rgba(0,0,0,0.28)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, rgba(200,164,77,1), rgba(138,108,76,1))",
            color: "#04101b",
            display: "grid",
            placeItems: "center",
            fontFamily: "Orbitron, monospace",
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: 1,
          }}
        >
          SIA
        </div>

        <div>
          <div
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: 13,
              letterSpacing: 2.6,
              color: "#f2e3b0",
            }}
          >
            Singapore Airlines
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: "rgba(238,244,251,0.66)",
            }}
          >
            AIRBUS A350-900 · FLIGHT CREW ATTENTION ANALYTICS
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${trackingColor}`,
            color: trackingColor,
            fontFamily: "Orbitron, monospace",
            fontSize: 10,
            letterSpacing: 1.8,
            background: "rgba(255,255,255,0.03)",
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
            letterSpacing: 1.8,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          ACTIVE AOI · {currentAOI}
        </div>

        <div style={{ minWidth: 96, textAlign: "right" }}>
          <div
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: 18,
              color: "#c8a44d",
              letterSpacing: 2,
            }}
          >
            {zulu}
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: "rgba(238,244,251,0.5)",
            }}
          >
            UTC · ZULU
          </div>
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
  onStart,
  onStop,
  onReset,
  onRecalibrate,
  onToggleAOI,
  onToggleHeatmap,
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
      <button onClick={onRecalibrate} style={btnStyle("#c8a44d", false)}>
        Recalibrate
      </button>
      <button onClick={onToggleAOI} style={btnStyle("#7fd6ff", false)}>
        {showAOIOverlay ? "Hide AOIs" : "Show AOIs"}
      </button>
      <button onClick={onToggleHeatmap} style={btnStyle("#ffb84d", false)}>
        {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
      </button>
    </div>
  );
}

function SessionStats({ sampleCount, heatmapCount, aoiCounts, sessionId }) {
  const sortedAOIs = Object.entries(aoiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div
      style={{
        position: "absolute",
        top: 84,
        right: 14,
        zIndex: 40,
        width: 320,
        borderRadius: 16,
        border: "1px solid rgba(200,164,77,0.28)",
        background: "rgba(6,23,43,0.92)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(200,164,77,0.2)",
          background:
            "linear-gradient(90deg, rgba(200,164,77,0.12), rgba(200,164,77,0.04))",
          fontFamily: "Orbitron, monospace",
          fontSize: 11,
          letterSpacing: 2,
          color: "#f2e3b0",
        }}
      >
        Crew Attention Summary
      </div>

      <div style={{ padding: 14, display: "grid", gap: 10 }}>
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
          label="Heatmap Cells"
          value={String(heatmapCount)}
          color="#ffb84d"
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
            Top Focus Zones
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            {sortedAOIs.length ? (
              sortedAOIs.map(([name, count]) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ color: "#eef4fb", fontSize: 13 }}>{name}</span>
                  <span
                    style={{
                      color: "#7fd6ff",
                      fontFamily: "Orbitron, monospace",
                      fontSize: 12,
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: "rgba(238,244,251,0.45)", fontSize: 13 }}>
                No AOI data yet.
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

  const [bounds, setBounds] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [showAOIOverlay, setShowAOIOverlay] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const [gazePoint, setGazePoint] = useState(null);
  const [heatmapMap, setHeatmapMap] = useState({});
  const [sampleBuffer, setSampleBuffer] = useState([]);
  const [lastBatch, setLastBatch] = useState(null);
  const [currentAOI, setCurrentAOI] = useState("NONE");
  const [aoiCounts, setAoiCounts] = useState({});

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

  const resolvedAOIs = useMemo(() => {
    if (!bounds) return [];
    return resolveAOIRects(DEFAULT_AOIS, bounds);
  }, [bounds]);

  useEffect(() => {
    if (!isTracking || !bounds || gaze == null) return;

    const gazeX = gaze.x ?? gaze.screenX ?? gaze.clientX;
    const gazeY = gaze.y ?? gaze.screenY ?? gaze.clientY;

    if (typeof gazeX !== "number" || typeof gazeY !== "number") return;

    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const local = viewportToLocal(gazeX, gazeY, rect);
    if (!isInsideRect(local.x, local.y, rect)) return;

    const smoothX = filterXRef.current.filter(local.x);
    const smoothY = filterYRef.current.filter(local.y);

    const clampedPoint = {
      x: Math.max(0, Math.min(rect.width, smoothX)),
      y: Math.max(0, Math.min(rect.height, smoothY)),
    };

    const edgeMargin = 24;
    if (
      clampedPoint.x < edgeMargin ||
      clampedPoint.y < edgeMargin ||
      clampedPoint.x > rect.width - edgeMargin ||
      clampedPoint.y > rect.height - edgeMargin
    ) {
      return;
    }

    setGazePoint(clampedPoint);

    const aoiId = mapPointToAOI(clampedPoint.x, clampedPoint.y, resolvedAOIs);
    setCurrentAOI(aoiId);

    setAoiCounts((prev) => ({
      ...prev,
      [aoiId]: (prev[aoiId] || 0) + 1,
    }));

    const { gx, gy } = pointToGridCell(
      clampedPoint.x,
      clampedPoint.y,
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

    const { nx, ny } = normalizePoint(clampedPoint.x, clampedPoint.y, rect);

    const sample = {
      sessionId: backendSessionIdRef.current || sessionIdRef.current,
      tsMs: Date.now(),
      elapsedMs: Date.now() - sessionStartRef.current,
      x: Number(clampedPoint.x.toFixed(2)),
      y: Number(clampedPoint.y.toFixed(2)),
      nx: Number(nx.toFixed(4)),
      ny: Number(ny.toFixed(4)),
      aoi: aoiId,
      confidence: 1,
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
    if (!isTracking) return;

    const interval = setInterval(() => {
      setSampleBuffer((prev) => {
        if (!prev.length) return prev;
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

    return () => clearInterval(interval);
  }, [isTracking]);
  const heatmapCells = useMemo(() => Object.values(heatmapMap), [heatmapMap]);

  const handleStartTracking = async () => {
    filterXRef.current.reset();
    filterYRef.current.reset();

    try {
      if (!bounds) {
        throw new Error("Simulator bounds not ready");
      }

      if (!backendSessionIdRef.current) {
        await startBackendSession(bounds);
      }

      await webgazer?.start?.();
      setIsTracking(true);
    } catch (err) {
      console.error("Failed to start tracking:", err);
      alert(`Failed to start tracking: ${err?.message || err}`);
    }
  };

  const handleStopTracking = async () => {
    try {
      await webgazer?.stop?.();

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
    }
  };

  const handleResetSession = () => {
    sessionIdRef.current = `flight_${Date.now()}`;
    setHeatmapMap({});
    setSampleBuffer([]);
    setLastBatch(null);
    setGazePoint(null);
    setCurrentAOI("NONE");
    setAoiCounts({});
    filterXRef.current.reset();
    filterYRef.current.reset();
  };

  const handleRecalibrate = async () => {
    try {
      await calibration?.reset?.();
    } finally {
      setIsCalibrated(false);
      setIsTracking(false);
      setGazePoint(null);
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

      <BrandHeader
        isReady={isReady}
        isCalibrated={isCalibrated}
        isTracking={isTracking}
        currentAOI={currentAOI}
      />

      <SessionStats
        sampleCount={sampleBuffer.length}
        heatmapCount={heatmapCells.length}
        aoiCounts={aoiCounts}
        sessionId={sessionIdRef.current}
      />

      <ControlDock
        isReady={isReady}
        isCalibrated={isCalibrated}
        isTracking={isTracking}
        showAOIOverlay={showAOIOverlay}
        showHeatmap={showHeatmap}
        onStart={handleStartTracking}
        onStop={handleStopTracking}
        onReset={handleResetSession}
        onRecalibrate={handleRecalibrate}
        onToggleAOI={() => setShowAOIOverlay((v) => !v)}
        onToggleHeatmap={() => setShowHeatmap((v) => !v)}
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

      {bounds && isReady && !isCalibrated && (
        <CalibrationOverlay
          bounds={bounds}
          quickMode={false}
          allowSkip={false}
          title="Singapore Airlines Crew Attention Calibration"
          subtitle="Complete gaze-point calibration before starting the A350-900 attention analytics session."
          onRecordPoint={(x, y) => calibration?.recordPoint?.(x, y)}
          onComplete={async () => {
            try {
              await calibration?.complete?.();
            } catch (err) {
              console.warn(
                "Calibration complete call failed, continuing in test mode:",
                err,
              );
            } finally {
              setIsCalibrated(true);
            }
          }}
        />
      )}

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
          aoiCounts={aoiCounts}
        />
      </div>
    </div>
  );
}
