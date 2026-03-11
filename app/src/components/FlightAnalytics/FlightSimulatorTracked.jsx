import React, { useEffect, useMemo, useRef, useState } from "react";
import FlightSimulator from "../FlightSimulator";
import WebGazerSingleton from "../../utils/WebGazerSingleton";
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

export default function FlightSimulatorTracked() {
  const rootRef = useRef(null);

  const [bounds, setBounds] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const [showAOIOverlay, setShowAOIOverlay] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const [gazePoint, setGazePoint] = useState(null);
  const [heatmapMap, setHeatmapMap] = useState({});
  const [sampleBuffer, setSampleBuffer] = useState([]);
  const [lastBatch, setLastBatch] = useState(null);
  const [currentAOI, setCurrentAOI] = useState("NONE");
  const [aoiCounts, setAoiCounts] = useState({});

  const sessionIdRef = useRef(`flight_${Date.now()}`);

  const filterXRef = useRef(new KalmanFilter());
  const filterYRef = useRef(new KalmanFilter());

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

    let mounted = true;

    WebGazerSingleton.init()
      .then(() => {
        if (mounted) setIsReady(true);
      })
      .catch((err) => {
        console.error(err);
        alert("WebGazer failed to initialize. Check that webgazer.js is loaded.");
      });

    return () => {
      mounted = false;
      window.removeEventListener("resize", measure);
      WebGazerSingleton.pause();
    };
  }, []);

  const resolvedAOIs = useMemo(() => {
    if (!bounds) return [];
    return resolveAOIRects(DEFAULT_AOIS, bounds);
  }, [bounds]);

  useEffect(() => {
    if (!isTracking || !bounds) return;

    const onGaze = (point) => {
      if (!rootRef.current) return;

      const rect = rootRef.current.getBoundingClientRect();
      const local = viewportToLocal(point.x, point.y, rect);

      if (!isInsideRect(local.x, local.y, rect)) return;

      const smoothX = filterXRef.current.filter(local.x);
      const smoothY = filterYRef.current.filter(local.y);

      const clampedPoint = {
        x: Math.max(0, Math.min(rect.width, smoothX)),
        y: Math.max(0, Math.min(rect.height, smoothY)),
      };

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
        GRID_ROWS
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
        sessionId: sessionIdRef.current,
        ts: Date.now(),
        x: Number(clampedPoint.x.toFixed(2)),
        y: Number(clampedPoint.y.toFixed(2)),
        nx: Number(nx.toFixed(4)),
        ny: Number(ny.toFixed(4)),
        aoi: aoiId,
        confidence: point.confidence ?? 1,
        grid: { x: gx, y: gy },
      };

      setSampleBuffer((prev) => {
        const next = [...prev, sample];
        if (next.length > MAX_BUFFER_SIZE) {
          return next.slice(next.length - MAX_BUFFER_SIZE);
        }
        return next;
      });
    };

    WebGazerSingleton.addListener(onGaze);
    WebGazerSingleton.resume();

    return () => {
      WebGazerSingleton.removeListener(onGaze);
    };
  }, [isTracking, bounds, resolvedAOIs]);

  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setSampleBuffer((prev) => {
        if (!prev.length) return prev;

        const payload = {
          sessionId: sessionIdRef.current,
          scenarioId: "demo-flight-sim",
          simulator: "local-react-demo",
          flushedAt: new Date().toISOString(),
          sampleCount: prev.length,
          samples: prev,
        };

        console.log("Generated batch payload:", payload);
        setLastBatch(payload);

        return [];
      });
    }, BATCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isTracking]);

  const heatmapCells = useMemo(() => Object.values(heatmapMap), [heatmapMap]);

  const handleStartTracking = () => {
    filterXRef.current.reset();
    filterYRef.current.reset();
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    WebGazerSingleton.pause();
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

  const handleRecalibrate = () => {
    WebGazerSingleton.clearData();
    setIsCalibrated(false);
    setIsTracking(false);
    setGazePoint(null);
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflow: "hidden",
        background: "#050508",
      }}
    >
      <FlightSimulator />

      {bounds && (
        <>
          <HeatmapOverlay
            cells={heatmapCells}
            bounds={bounds}
            cols={GRID_COLS}
            rows={GRID_ROWS}
            visible={showHeatmap}
          />
          <AOIOverlay aois={resolvedAOIs} visible={showAOIOverlay} />
          <GazeDot point={gazePoint} />
        </>
      )}

      {bounds && isReady && !isCalibrated && (
        <CalibrationOverlay
          bounds={bounds}
          clicksPerPoint={5}
          onComplete={() => {
            setIsCalibrated(true);
            setIsTracking(true);
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          zIndex: 70,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          maxWidth: 520,
        }}
      >
        <button onClick={handleStartTracking} disabled={!isCalibrated || isTracking} style={btnStyle("#0a7")}>
          Start Tracking
        </button>
        <button onClick={handleStopTracking} disabled={!isTracking} style={btnStyle("#a50")}>
          Stop Tracking
        </button>
        <button onClick={handleResetSession} style={btnStyle("#246")}>
          Reset Session
        </button>
        <button onClick={handleRecalibrate} style={btnStyle("#555")}>
          Recalibrate
        </button>
        <button onClick={() => setShowAOIOverlay((v) => !v)} style={btnStyle("#334")}>
          {showAOIOverlay ? "Hide AOIs" : "Show AOIs"}
        </button>
        <button onClick={() => setShowHeatmap((v) => !v)} style={btnStyle("#433")}>
          {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
        </button>
      </div>

      <BatchDebugPanel
        isTracking={isTracking}
        currentAOI={currentAOI}
        sampleBufferCount={sampleBuffer.length}
        lastBatch={lastBatch}
        aoiCounts={aoiCounts}
      />
    </div>
  );
}

function btnStyle(borderColor) {
  return {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${borderColor}`,
    background: "rgba(10,12,18,0.88)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };
}