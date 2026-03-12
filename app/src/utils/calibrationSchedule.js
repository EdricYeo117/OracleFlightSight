/**
 * Module: app/src/utils/calibrationSchedule.js
 * Layer: Frontend
 * Purpose:
 * - Builds a short multi-stage calibration schedule for WebGazer.
 */

export function generateOuter3x3Targets() {
  const xs = [0.1, 0.5, 0.9];
  const ys = [0.1, 0.5, 0.9];

  const targets = [];
  let index = 0;

  for (const yPct of ys) {
    for (const xPct of xs) {
      targets.push({
        id: `outer_${index + 1}`,
        xPct,
        yPct,
      });
      index += 1;
    }
  }

  return targets;
}

export function generateInner3x3Targets() {
  const xs = [0.38, 0.5, 0.62];
  const ys = [0.38, 0.5, 0.62];

  const targets = [];
  let index = 0;

  for (const yPct of ys) {
    for (const xPct of xs) {
      targets.push({
        id: `inner_${index + 1}`,
        xPct,
        yPct,
      });
      index += 1;
    }
  }

  return targets;
}

export function generateRandomTargets(count = 5, margin = 0.12) {
  const targets = [];

  for (let i = 0; i < count; i += 1) {
    const xPct = margin + Math.random() * (1 - margin * 2);
    const yPct = margin + Math.random() * (1 - margin * 2);

    targets.push({
      id: `random_${i + 1}`,
      xPct,
      yPct,
    });
  }

  return targets;
}

export function buildCalibrationSchedule({ randomCount = 5 } = {}) {
  const schedule = [];

  generateOuter3x3Targets().forEach((target, pointIndex) => {
    schedule.push({
      phase: "outer_3x3",
      pointIndex,
      target,
    });
  });

  generateInner3x3Targets().forEach((target, pointIndex) => {
    schedule.push({
      phase: "inner_3x3",
      pointIndex,
      target,
    });
  });

  generateRandomTargets(randomCount).forEach((target, pointIndex) => {
    schedule.push({
      phase: "random_refine",
      pointIndex,
      target,
    });
  });

  return schedule;
}

export function getPhaseLabel(phase) {
  switch (phase) {
    case "outer_3x3":
      return "Outer 3x3";
    case "inner_3x3":
      return "Inner Center 3x3";
    case "random_refine":
      return "Random Refinement";
    default:
      return phase;
  }
}