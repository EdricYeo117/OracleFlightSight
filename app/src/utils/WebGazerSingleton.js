class WebGazerSingleton {
  constructor() {
    this.webgazer = null;
    this.initialized = false;
    this.active = false;
    this.listeners = new Set();
    this.boundListener = this.handleGaze.bind(this);
  }

  async init() {
    if (this.initialized) return this.webgazer;

    const wg = window.webgazer;
    if (!wg) {
      throw new Error("WebGazer not found on window.webgazer");
    }

    this.webgazer = wg;

    await wg
      .setRegression("weightedRidge")
      .setTracker("TFFacemesh")
      .saveDataAcrossSessions(true)
      .showFaceOverlay(true)
      .showFaceFeedbackBox(true)
      .showPredictionPoints(false)
      .begin();

    wg.setGazeListener(this.boundListener);

    this.initialized = true;
    this.active = true;
    return wg;
  }

  handleGaze(data, elapsedTime) {
    if (!this.active || !data) return;
    if (typeof data.x !== "number" || typeof data.y !== "number") return;

    const point = {
      x: data.x,
      y: data.y,
      elapsedTime,
      confidence: typeof data.confidence === "number" ? data.confidence : 1,
      timestamp: Date.now(),
    };

    this.listeners.forEach((listener) => {
      try {
        listener(point);
      } catch (err) {
        console.error("WebGazer listener error:", err);
      }
    });
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  pause() {
    this.active = false;
    if (this.webgazer?.pause) this.webgazer.pause();
  }

  resume() {
    this.active = true;
    if (this.webgazer?.resume) this.webgazer.resume();
  }

  recordCalibrationPoint(x, y) {
    if (this.webgazer?.recordScreenPosition) {
      this.webgazer.recordScreenPosition(x, y, "click");
    }
  }

  clearData() {
    if (this.webgazer?.clearData) {
      this.webgazer.clearData();
    }
    window.localStorage.removeItem("webgazerGlobalData");
  }

  end() {
    this.active = false;
    if (this.webgazer?.end) {
      this.webgazer.end();
    }
    this.initialized = false;
    this.listeners.clear();
  }
}

const instance = new WebGazerSingleton();
export default instance;