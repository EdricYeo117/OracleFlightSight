import React from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function StaticSimulatorFrame() {
  return (
    <div className="sim-frame">
      <div className="sim-topbar">
        <div className="sim-topbar-left">
          <span className="sim-topbar-brand">MSFS · 2024</span>
          <span className="sim-topbar-tag">BOEING 737-800</span>
          <span className="sim-topbar-tag">N737AA</span>
          <span className="sim-topbar-tag">IFR</span>
        </div>
        <div className="sim-topbar-right">
          <span className="sim-topbar-zulu">ZULU</span>
          <span className="sim-topbar-time">10:52:49</span>
          <span className="sim-topbar-ap">AP ON</span>
        </div>
      </div>

      <div className="sim-main">
        <div className="sim-left-panel">
          <div className="sim-panel-title">RADIO ◆ NAV</div>
          <div className="sim-strip">
            <span>COM 1</span>
            <strong>121.5</strong>
          </div>
          <div className="sim-strip">
            <span>COM 2</span>
            <strong>118.3</strong>
          </div>
          <div className="sim-strip">
            <span>NAV 1</span>
            <strong className="green">112.30</strong>
          </div>
          <div className="sim-strip">
            <span>NAV 2</span>
            <strong>108.75</strong>
          </div>
          <div className="sim-transponder">
            <div className="sim-transponder-code">1200</div>
            <div className="sim-transponder-sub">MODE C · ALT</div>
          </div>
        </div>

        <div className="sim-outside-view">
          <div className="sim-sky" />
          <div className="sim-cloud sim-cloud-1" />
          <div className="sim-cloud sim-cloud-2" />
          <div className="sim-cloud sim-cloud-3" />
          <div className="sim-ground" />
          <div className="sim-horizon-glow" />

          <svg
            className="sim-hud"
            viewBox="0 0 1200 600"
            preserveAspectRatio="none"
          >
            <rect
              x="460"
              y="255"
              width="280"
              height="90"
              fill="none"
              stroke="rgba(0,255,150,0.18)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <circle
              cx="600"
              cy="295"
              r="12"
              fill="none"
              stroke="rgba(0,255,150,0.9)"
              strokeWidth="1.5"
            />
            <line
              x1="580"
              y1="295"
              x2="588"
              y2="295"
              stroke="rgba(0,255,150,0.9)"
              strokeWidth="1.5"
            />
            <line
              x1="612"
              y1="295"
              x2="620"
              y2="295"
              stroke="rgba(0,255,150,0.9)"
              strokeWidth="1.5"
            />
            <line
              x1="600"
              y1="275"
              x2="600"
              y2="283"
              stroke="rgba(0,255,150,0.9)"
              strokeWidth="1.5"
            />
            <rect
              x="30"
              y="150"
              width="60"
              height="300"
              fill="rgba(0,0,0,0.35)"
              rx="3"
            />
            <rect
              x="1110"
              y="150"
              width="60"
              height="300"
              fill="rgba(0,0,0,0.35)"
              rx="3"
            />
            <rect
              x="430"
              y="530"
              width="340"
              height="40"
              fill="rgba(0,0,0,0.42)"
              rx="3"
            />
          </svg>
        </div>

        <div className="sim-right-panel">
          <div className="sim-panel-title">ENGINE ◆ FUEL</div>
          <div className="sim-right-strip">
            <span>HYD 1</span>
            <strong>3000 PSI</strong>
          </div>
          <div className="sim-right-strip">
            <span>FLAPS</span>
            <strong>0°</strong>
          </div>
          <div className="sim-right-strip">
            <span>GEAR</span>
            <strong className="amber">UP</strong>
          </div>
          <div className="sim-waypoint">
            <div className="sim-waypoint-label">WAYPOINT</div>
            <div className="sim-waypoint-row">
              <strong>KLAX</strong>
              <span>ETA 00:42</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sim-bottom-cluster">
        <div className="sim-gauge gauge-blue" />
        <div className="sim-gauge gauge-cyan" />
        <div className="sim-gauge gauge-green" />
        <div className="sim-gauge gauge-amber" />
        <div className="sim-gauge gauge-gold" />
      </div>

      <div className="sim-statusbar">
        <span>LNAV ● VNAV ● TOGA ● A/T ARM</span>
        <span>FMC ACTIVE · ROUTE LOADED · NO WARNINGS</span>
        <span>SIM RATE 1× · WEATHER LIVE · AI TRAFFIC ON</span>
      </div>
    </div>
  );
}

export default function FixationOverlay({
  fixations = [],
  screenWidth = 1920,
  screenHeight = 1080,
}) {
  const topFixations = [...fixations]
    .sort((a, b) => Number(b.DURATION_MS ?? 0) - Number(a.DURATION_MS ?? 0))
    .slice(0, 150);

  return (
    <div className="panel panel-tall">
      <div className="panel-header">
        <div>
          <h3>Simulator Focus Overlay</h3>
          <p>
            Fixation clusters rendered directly over a static simulator frame
          </p>
        </div>
      </div>

      <div className="fixation-stage">
        <div className="fixation-canvas">
          <StaticSimulatorFrame />
          <div className="fixation-vignette" />

          {topFixations.map((f) => {
            const x = Number(f.CENTER_X ?? 0);
            const y = Number(f.CENTER_Y ?? 0);
            const duration = Number(f.DURATION_MS ?? 0);

            const leftPct = screenWidth ? (x / screenWidth) * 100 : 0;
            const topPct = screenHeight ? (y / screenHeight) * 100 : 0;
            const size = clamp(duration / 65, 10, 54);
            const glow = clamp(duration / 32, 18, 72);

            return (
              <div
                key={f.FIXATION_ID}
                className="fixation-node"
                title={`${f.AOI ?? "NONE"} • ${duration} ms`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  boxShadow: `0 0 ${glow}px rgba(255,107,122,0.42)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
