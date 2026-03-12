import React, { useMemo, useState } from "react";
import {
  buildCalibrationSchedule,
  getPhaseLabel,
} from "../../utils/calibrationSchedule";

export default function CalibrationOverlay({
  bounds,
  title = "Eye Tracking Calibration",
  subtitle = "Look at each dot and click it once.",
  onRecordPoint,
  onComplete,
  randomCount = 5,
}) {
  const schedule = useMemo(() => {
    return buildCalibrationSchedule({ randomCount });
  }, [randomCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const currentStep = schedule[currentIndex] || null;
  const totalSteps = schedule.length;
  const completedCount = currentIndex;

  const handleClick = async () => {
    if (!bounds || !currentStep || isFinishing) return;

    const x = bounds.width * currentStep.target.xPct;
    const y = bounds.height * currentStep.target.yPct;

    try {
      await onRecordPoint?.(x, y, {
        ...currentStep.target,
        phase: currentStep.phase,
        pointIndex: currentStep.pointIndex,
        scheduleIndex: currentIndex,
        totalSteps,
      });

      const nextIndex = currentIndex + 1;

      if (nextIndex >= totalSteps) {
        setIsFinishing(true);
        await onComplete?.({
          totalSteps,
          randomCount,
        });
        return;
      }

      setCurrentIndex(nextIndex);
    } catch (err) {
      console.error("Calibration point record failed:", err);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "14px 20px",
          borderRadius: 12,
          background: "rgba(10,15,28,0.95)",
          color: "#fff",
          border: "1px solid rgba(74,170,255,0.4)",
          fontFamily: "sans-serif",
          textAlign: "center",
          minWidth: 420,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          {title}
        </div>

        <div style={{ fontSize: 14, opacity: 0.92 }}>
          {subtitle}
        </div>

        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
          Progress: {completedCount} / {totalSteps}
        </div>

        {currentStep && (
          <div style={{ fontSize: 12, opacity: 0.88, marginTop: 6 }}>
            Phase: {getPhaseLabel(currentStep.phase)}
          </div>
        )}

        {isFinishing && (
          <div style={{ fontSize: 12, color: "#7cffb2", marginTop: 6 }}>
            Finalizing calibration...
          </div>
        )}
      </div>

      {currentStep && !isFinishing && (
        <button
          onClick={handleClick}
          style={{
            position: "absolute",
            left: `${currentStep.target.xPct * 100}%`,
            top: `${currentStep.target.yPct * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "2px solid #ffd84d",
            background: "rgba(255,216,77,0.32)",
            boxShadow: "0 0 30px rgba(255,216,77,0.95)",
            cursor: "pointer",
          }}
        />
      )}
    </div>
  );
}