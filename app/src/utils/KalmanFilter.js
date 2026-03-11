export default class KalmanFilter {
  constructor({
    R = 0.01, // measurement noise
    Q = 3,    // process noise
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

      const K =
        predCov * this.C * (1 / (this.C * predCov * this.C + this.Q));

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