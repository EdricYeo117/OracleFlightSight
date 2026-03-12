/**
 * Module: app/src/utils/KalmanFilter.js
 * Layer: Frontend
 * Purpose:
 * - Implements the KalmanFilter unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

export default class KalmanFilter {
  constructor({
    R = 0.35,
    Q = 0.7,
    A = 1,
    B = 0,
    C = 1,
  } = {}) {
    this.R = R;
    this.Q = Q;
    this.A = A;
    this.B = B;
    this.C = C;

    this.cov = NaN;
    this.x = NaN;
  }

  filter(z, u = 0) {
    if (Number.isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      const predX = this.predict(u);
      const predCov = this.uncertainty();

      const K = (predCov * this.C) / (this.C * predCov * this.C + this.Q);

      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }

    return this.x;
  }

  predict(u = 0) {
    return this.A * this.x + this.B * u;
  }

  uncertainty() {
    return this.A * this.cov * this.A + this.R;
  }

  reset() {
    this.cov = NaN;
    this.x = NaN;
  }
}