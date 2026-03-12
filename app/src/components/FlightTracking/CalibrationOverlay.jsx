import React, { useMemo, useState } from "react";

const POINTS = [
  { id: "p1", xPct: 0.1, yPct: 0.1 },
  { id: "p2", xPct: 0.5, yPct: 0.1 },
  { id: "p3", xPct: 0.9, yPct: 0.1 },
  { id: "p4", xPct: 0.1, yPct: 0.5 },
  { id: "p5", xPct: 0.5, yPct: 0.5 },
  { id: "p6", xPct: 0.9, yPct: 0.5 },
  { id: "p7", xPct: 0.1, yPct: 0.9 },
  { id: "p8", xPct: 0.5, yPct: 0.9 },
  { id: "p9", xPct: 0.9, yPct: 0.9 },
];

export default function CalibrationOverlay({
  bounds,
  clicksPerPoint = 5,
  title = "Eye Tracking Calibration",
  subtitle = "Keep your head still, look directly at each point, and click it 5 times.",
  onRecordPoint,
  onComplete,
}) {
  const [counts, setCounts] = useState({});
  const [isFinishing, setIsFinishing] = useState(false);

  const completedCount = useMemo(() => {
    return POINTS.filter((point) => (counts[point.id] || 0) >= clicksPerPoint).length;
  }, [counts, clicksPerPoint]);

  const handleClick = async (point) => {
    if (!bounds || isFinishing) return;

    const current = counts[point.id] || 0;
    if (current >= clicksPerPoint) return;

    const next = current + 1;
    const nextCounts = { ...counts, [point.id]: next };
    setCounts(nextCounts);

    const x = bounds.width * point.xPct;
    const y = bounds.height * point.yPct;

    try {
      await onRecordPoint?.(x, y, point);
    } catch (err) {
      console.error("Calibration point record failed:", err);
      return;
    }

    const allDone =
      POINTS.filter((p) => (nextCounts[p.id] || 0) >= clicksPerPoint).length === POINTS.length;

    if (allDone) {
      try {
        setIsFinishing(true);
        await onComplete?.();
      } catch (err) {
        console.error("Calibration completion failed:", err);
        setIsFinishing(false);
      }
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 18px",
          borderRadius: 12,
          background: "rgba(10,15,28,0.94)",
          color: "#fff",
          border: "1px solid rgba(74,170,255,0.4)",
          fontFamily: "sans-serif",
          textAlign: "center",
          minWidth: 360,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          {title}
        </div>

        <div style={{ fontSize: 14, opacity: 0.92 }}>
          {subtitle}
        </div>

        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
          Sit at your normal simulator distance. Keep your face centered and avoid moving after calibration.
        </div>

        <div style={{ fontSize: 13, color: "#4af", marginTop: 8 }}>
          Completed: {completedCount} / {POINTS.length}
        </div>

        {isFinishing && (
          <div style={{ fontSize: 12, color: "#4f4", marginTop: 6 }}>
            Finalizing calibration...
          </div>
        )}
      </div>

      {POINTS.map((point) => {
        const current = counts[point.id] || 0;
        const done = current >= clicksPerPoint;
        const progress = Math.min(current / clicksPerPoint, 1);

        return (
          <button
            key={point.id}
            onClick={() => handleClick(point)}
            disabled={done || isFinishing}
            style={{
              position: "absolute",
              left: `${point.xPct * 100}%`,
              top: `${point.yPct * 100}%`,
              transform: "translate(-50%, -50%)",
              width: done ? 26 : 38,
              height: done ? 26 : 38,
              borderRadius: "50%",
              border: done ? "2px solid #4f4" : "2px solid #ffd84d",
              background: done
                ? "rgba(0,255,100,0.22)"
                : `rgba(255,216,77,${0.25 + progress * 0.45})`,
              boxShadow: done
                ? "0 0 18px rgba(0,255,100,0.6)"
                : "0 0 28px rgba(255,216,77,0.9)",
              cursor: done || isFinishing ? "default" : "pointer",
            }}
            title={`Calibration point ${point.id}`}
          >
            <span
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {done ? "✓" : `${current}/${clicksPerPoint}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}