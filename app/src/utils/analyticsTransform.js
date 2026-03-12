export function buildHeatmapMatrix(
  heatmapCells = [],
  gridCols = 40,
  gridRows = 24,
) {
  const matrix = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => 0),
  );

  for (const cell of heatmapCells) {
    const x = Number(cell.GRID_X ?? cell.gridX);
    const y = Number(cell.GRID_Y ?? cell.gridY);

    if (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      y >= 0 &&
      y < gridRows &&
      x >= 0 &&
      x < gridCols
    ) {
      matrix[y][x] = Number(
        cell.TOTAL_DWELL_MS ??
          cell.totalDwellMs ??
          cell.SAMPLE_COUNT ??
          cell.sampleCount ??
          0,
      );
    }
  }

  return matrix;
}

export function mapAoiDwellChart(rows = []) {
  return rows.map((row) => ({
    x: row.aoi ?? row.AOI ?? "UNKNOWN",
    y: Number(row.totalDwellMs ?? row.TOTAL_DWELL_MS ?? 0),
    fixationCount: Number(row.fixationCount ?? row.FIXATION_COUNT ?? 0),
    visitCount: Number(row.visitCount ?? row.VISIT_COUNT ?? 0),
  }));
}

export function mapRuleStatusSummary(ruleResults = []) {
  const passed = ruleResults.filter(
    (r) => Number(r.PASSED) === 1 || r.passed === true,
  ).length;
  const failed = ruleResults.length - passed;

  return [
    { x: "Passed", y: passed },
    { x: "Failed", y: failed },
  ];
}
