export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function viewportToLocal(gazeX, gazeY, rect) {
  return {
    x: gazeX - rect.left,
    y: gazeY - rect.top,
  };
}

export function isInsideRect(x, y, rect) {
  return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
}

export function normalizePoint(x, y, rect) {
  return {
    nx: rect.width ? x / rect.width : 0,
    ny: rect.height ? y / rect.height : 0,
  };
}

export function pointToGridCell(x, y, width, height, cols = 40, rows = 24) {
  const gx = clamp(Math.floor((x / width) * cols), 0, cols - 1);
  const gy = clamp(Math.floor((y / height) * rows), 0, rows - 1);
  return { gx, gy };
}