/**
 * Module: app/src/components/FlightSimulator.jsx
 * Layer: Frontend
 * Purpose:
 * - Implements the FlightSimulator unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import { useState, useEffect, useRef } from "react";

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function useAnimatedValue(target, speed = 0.05) {
  const [value, setValue] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    let raf;
    const animate = () => {
      ref.current += (target - ref.current) * speed;
      setValue(ref.current);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, speed]);
  return value;
}

// Artificial Horizon
function ArtificialHorizon({ pitch, roll }) {
  const animPitch = useAnimatedValue(pitch, 0.08);
  const animRoll = useAnimatedValue(roll, 0.08);
  return (
    <div style={{ position: "relative", width: 180, height: 180, borderRadius: "50%", overflow: "hidden", border: "3px solid #4af", boxShadow: "0 0 20px #4af8, inset 0 0 30px #000a" }}>
      <div style={{
        position: "absolute", width: "100%", height: "200%",
        top: `${50 - animPitch * 1.2}%`,
        transform: `translateY(-50%) rotate(${animRoll}deg)`,
        transformOrigin: "center center",
      }}>
        <div style={{ height: "50%", background: "linear-gradient(180deg, #1a6db5 0%, #2a8fd4 100%)" }} />
        <div style={{ height: "50%", background: "linear-gradient(180deg, #8B5E3C 0%, #6B4226 100%)" }} />
      </div>
      {/* Pitch lines */}
      {[-20, -10, 0, 10, 20].map(p => (
        <div key={p} style={{
          position: "absolute", left: "50%", width: p === 0 ? "70%" : "40%",
          height: 1, background: p === 0 ? "#fff" : "rgba(255,255,255,0.5)",
          top: `${50 - (animPitch - p) * 1.2}%`,
          transform: `translateX(-50%) rotate(${animRoll}deg)`,
          transformOrigin: "center",
        }} />
      ))}
      {/* Center marker */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 60, height: 2, background: "#ff0" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: "#ff0" }} />
      {/* Roll indicator arc */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        {[-60,-45,-30,-20,-10,0,10,20,30,45,60].map(a => {
          const r = 78, rad = (a - 90) * Math.PI / 180;
          const x1 = 90 + r * Math.cos(rad), y1 = 90 + r * Math.sin(rad);
          const len = a % 30 === 0 ? 10 : a % 10 === 0 ? 6 : 4;
          const x2 = 90 + (r - len) * Math.cos(rad), y2 = 90 + (r - len) * Math.sin(rad);
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={a % 30 === 0 ? 2 : 1} />;
        })}
        {/* Roll pointer */}
        <polygon points="90,12 86,22 94,22" fill="#ff0" transform={`rotate(${animRoll}, 90, 90)`} />
      </svg>
      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", color: "#4af", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>ATT</div>
    </div>
  );
}

// Airspeed Indicator
function AirspeedIndicator({ speed }) {
  const animSpeed = useAnimatedValue(speed, 0.04);
  const angle = clamp((animSpeed / 400) * 300 - 150, -150, 150);
  return (
    <GaugeBase label="AIRSPEED" unit="KTS" value={Math.round(animSpeed)} color="#4af" max={400}>
      <GaugeNeedle angle={angle} color="#fff" />
      {[0,50,100,150,200,250,300,400].map(v => {
        const a = (v / 400) * 300 - 150;
        return <GaugeTick key={v} angle={a} label={v} />;
      })}
      <GaugeArc from={-150} to={-30} color="rgba(255,255,0,0.3)" />
      <GaugeArc from={-30} to={60} color="rgba(0,255,100,0.3)" />
      <GaugeArc from={60} to={150} color="rgba(255,50,50,0.3)" />
    </GaugeBase>
  );
}

// Altimeter
function Altimeter({ altitude }) {
  const animAlt = useAnimatedValue(altitude, 0.03);
  const angle = ((animAlt % 1000) / 1000) * 360 - 180;
  return (
    <GaugeBase label="ALTITUDE" unit="FT" value={Math.round(animAlt)} color="#4f4" max={10000}>
      <GaugeNeedle angle={angle} color="#fff" />
      <GaugeNeedle angle={(animAlt / 10000) * 360 - 180} color="#aaa" short />
      {[0,1,2,3,4,5,6,7,8,9].map(v => {
        const a = (v / 10) * 360 - 180;
        return <GaugeTick key={v} angle={a} label={v * 1000} small />;
      })}
    </GaugeBase>
  );
}

// VSI
function VSI({ vsi }) {
  const animVsi = useAnimatedValue(vsi, 0.06);
  const angle = clamp((animVsi / 2000) * 90, -90, 90);
  return (
    <GaugeBase label="VERT SPEED" unit="FPM" value={Math.round(animVsi)} color="#fa4" max={2000}>
      <GaugeNeedle angle={angle} color="#fff" />
      {[-2000,-1000,-500,0,500,1000,2000].map(v => {
        const a = (v / 2000) * 90;
        return <GaugeTick key={v} angle={a} label={v} small />;
      })}
    </GaugeBase>
  );
}

// Heading Indicator
function HeadingIndicator({ heading }) {
  const animHdg = useAnimatedValue(heading, 0.06);
  return (
    <div style={{ position: "relative", width: 180, height: 180, borderRadius: "50%", border: "3px solid #fa4", boxShadow: "0 0 20px #fa48, inset 0 0 30px #000a", background: "radial-gradient(circle, #1a1a2e 60%, #0d0d1a 100%)" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${-animHdg}deg)`, transformOrigin: "center" }}>
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(d => {
            const labels = { 0: "N", 90: "E", 180: "S", 270: "W" };
            const rad = (d - 90) * Math.PI / 180;
            const r = 75, ti = 65;
            return (
              <g key={d}>
                <line
                  x1={90 + r * Math.cos(rad)} y1={90 + r * Math.sin(rad)}
                  x2={90 + ti * Math.cos(rad)} y2={90 + ti * Math.sin(rad)}
                  stroke="white" strokeWidth={2}
                  style={{ position: "absolute" }}
                />
              </g>
            );
          })}
        </div>
        <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="84" fill="none" stroke="rgba(255,165,64,0.2)" strokeWidth="1" />
          <g transform={`rotate(${-animHdg}, 90, 90)`}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(d => {
              const labels = { 0: "N", 90: "E", 180: "S", 270: "W" };
              const rad = (d - 90) * Math.PI / 180;
              const r = 78, ti = 64, tl = 58;
              return (
                <g key={d}>
                  <line x1={90 + r * Math.cos(rad)} y1={90 + r * Math.sin(rad)} x2={90 + ti * Math.cos(rad)} y2={90 + ti * Math.sin(rad)} stroke="white" strokeWidth={labels[d] ? 2 : 1} />
                  {labels[d] && <text x={90 + tl * Math.cos(rad)} y={90 + tl * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill={labels[d] === "N" ? "#f44" : "#fff"} fontSize={labels[d] === "N" ? 14 : 12} fontWeight="bold" fontFamily="monospace">{labels[d]}</text>}
                  {!labels[d] && <text x={90 + tl * Math.cos(rad)} y={90 + tl * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="monospace">{d}</text>}
                </g>
              );
            })}
            {[0,10,20,40,50,70,80,100,110,130,140,160,170,190,200,220,230,250,260,280,290,310,320,340,350].map(d => {
              const rad = (d - 90) * Math.PI / 180;
              return <line key={d} x1={90 + 78 * Math.cos(rad)} y1={90 + 78 * Math.sin(rad)} x2={90 + 72 * Math.cos(rad)} y2={90 + 72 * Math.sin(rad)} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />;
            })}
          </g>
          {/* Fixed aircraft symbol */}
          <circle cx="90" cy="90" r="4" fill="#ff0" />
          <line x1="90" y1="90" x2="90" y2="20" stroke="#ff0" strokeWidth="2" />
          <polygon points="90,18 86,26 94,26" fill="#ff0" />
          <line x1="70" y1="90" x2="110" y2="90" stroke="#ff0" strokeWidth="2" />
        </svg>
      </div>
      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", color: "#fa4", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>{Math.round(animHdg)}°</div>
    </div>
  );
}

// Reusable gauge components
function GaugeBase({ label, unit, value, color, children }) {
  return (
    <div style={{ position: "relative", width: 180, height: 180, borderRadius: "50%", border: `3px solid ${color}`, boxShadow: `0 0 20px ${color}88, inset 0 0 30px #000a`, background: "radial-gradient(circle, #1a1a2e 60%, #0d0d1a 100%)" }}>
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 180 180">
        {children}
      </svg>
      <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", color, fontSize: 18, fontFamily: "'Orbitron', monospace", fontWeight: 700, textShadow: `0 0 10px ${color}` }}>{value}</div>
      <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 8, fontFamily: "monospace", letterSpacing: 2 }}>{unit}</div>
      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 8, fontFamily: "monospace", letterSpacing: 2 }}>{label}</div>
    </div>
  );
}

function GaugeNeedle({ angle, color = "#fff", short = false }) {
  const rad = (angle - 90) * Math.PI / 180;
  const len = short ? 45 : 65;
  const x2 = 90 + len * Math.cos(rad), y2 = 90 + len * Math.sin(rad);
  const bx = 90 - 15 * Math.cos(rad), by = 90 - 15 * Math.sin(rad);
  return (
    <>
      <line x1={bx} y1={by} x2={x2} y2={y2} stroke={color} strokeWidth={short ? 1.5 : 2.5} strokeLinecap="round" />
      <circle cx="90" cy="90" r="5" fill={color} />
    </>
  );
}

function GaugeTick({ angle, label, small }) {
  const rad = (angle - 90) * Math.PI / 180;
  const r = 78, ti = small ? 70 : 66, tl = small ? 60 : 55;
  return (
    <g>
      <line x1={90 + r * Math.cos(rad)} y1={90 + r * Math.sin(rad)} x2={90 + ti * Math.cos(rad)} y2={90 + ti * Math.sin(rad)} stroke="rgba(255,255,255,0.6)" strokeWidth={small ? 1 : 1.5} />
      <text x={90 + tl * Math.cos(rad)} y={90 + tl * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.5)" fontSize={small ? 7 : 8} fontFamily="monospace">{label}</text>
    </g>
  );
}

function GaugeArc({ from, to, color }) {
  const toRad = a => (a - 90) * Math.PI / 180;
  const r = 72;
  const x1 = 90 + r * Math.cos(toRad(from)), y1 = 90 + r * Math.sin(toRad(from));
  const x2 = 90 + r * Math.cos(toRad(to)), y2 = 90 + r * Math.sin(toRad(to));
  const large = (to - from) > 180 ? 1 : 0;
  return <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="8" />;
}

// Engine gauges
function EngineGauge({ label, value, color = "#4af" }) {
  const anim = useAnimatedValue(value, 0.04);
  const pct = clamp(anim / 100, 0, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: 1 }}>{label}</div>
      <div style={{ position: "relative", width: 28, height: 100, background: "rgba(255,255,255,0.05)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${pct * 100}%`, background: `linear-gradient(0deg, ${pct > 0.9 ? "#f44" : pct > 0.7 ? "#fa4" : color}, ${color}88)`, transition: "height 0.1s", borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 10, color, fontFamily: "'Orbitron', monospace", fontWeight: 700 }}>{Math.round(anim)}</div>
    </div>
  );
}

// PFD strip
function PFDStrip({ label, value, unit, color = "#4af" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 8px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 9, letterSpacing: 1 }}>{label}</span>
      <span style={{ color, fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700 }}>{value} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>{unit}</span></span>
    </div>
  );
}

export default function FlightSimulator() {
  const [sim, setSim] = useState({
    speed: 245, altitude: 8500, heading: 127,
    pitch: 2, roll: -5, vsi: 150,
    throttle: [78, 79], fuel: [8400, 8350],
    flaps: 0, gear: "UP", autopilot: true,
    time: new Date(),
    nav1: "112.30", nav2: "108.75",
    com1: "121.5", com2: "118.3",
    waypoint: "KLAX", eta: "00:42",
    lat: 34.052, lon: -118.243,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSim(prev => ({
        ...prev,
        speed: prev.speed + (Math.random() - 0.5) * 3,
        altitude: prev.altitude + prev.vsi / 600 + (Math.random() - 0.5) * 5,
        heading: (prev.heading + (Math.random() - 0.5) * 0.3 + 360) % 360,
        pitch: prev.pitch + (Math.random() - 0.5) * 0.4,
        roll: prev.roll + (Math.random() - 0.5) * 0.6,
        vsi: prev.vsi + (Math.random() - 0.5) * 30,
        fuel: [prev.fuel[0] - 0.8, prev.fuel[1] - 0.8],
        time: new Date(),
        lat: prev.lat + 0.0003,
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const formatTime = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;

  return (
    <div style={{
      minHeight: "100vh", background: "#050508",
      display: "flex", flexDirection: "column",
      fontFamily: "'Orbitron', monospace",
      overflow: "hidden",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, #0a1628 0%, #050508 60%)",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 24px", background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(74,170,255,0.2)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <div style={{ color: "#4af", fontSize: 14, fontWeight: 900, letterSpacing: 3 }}>MSFS<span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>2024</div>
          <div style={{ display: "flex", gap: 16 }}>
            {["BOEING 737-800", "N737AA", "IFR"].map(t => (
              <span key={t} style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 2, padding: "2px 8px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 1 }}>ZULU</span>
          <span style={{ color: "#fa4", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{formatTime(sim.time)}</span>
          <span style={{ color: sim.autopilot ? "#4f4" : "#f44", fontSize: 9, letterSpacing: 2, padding: "2px 8px", background: sim.autopilot ? "rgba(0,255,100,0.1)" : "rgba(255,50,50,0.1)", border: `1px solid ${sim.autopilot ? "#4f4" : "#f44"}`, borderRadius: 2 }}>AP {sim.autopilot ? "ON" : "OFF"}</span>
        </div>
      </div>

      {/* Main viewport */}
      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
        {/* Simulated outside view */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1a3a6e 0%, #2a5fa8 35%, #3a7ad4 50%, #b8860b 52%, #8B5E3C 65%, #6B4226 100%)" }}>
          {/* Sky atmosphere */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, #0d1f3c 0%, #1a4d8f 40%, #4a90d9 100%)" }} />
          {/* Horizon glow */}
          <div style={{ position: "absolute", top: "47%", left: "10%", right: "10%", height: 30, background: "rgba(255,200,100,0.3)", filter: "blur(20px)", borderRadius: "50%" }} />
          {/* Ground */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48%", background: "linear-gradient(180deg, #8B5E3C 0%, #5a3d20 100%)" }}>
            {/* Ground grid lines */}
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ position: "absolute", left: `${i * 14}%`, top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.15)", transform: `perspective(400px) rotateX(70deg)` }} />
            ))}
          </div>
          {/* Clouds */}
          {[{x:10,y:35,w:200},{x:40,y:30,w:300},{x:70,y:38,w:180},{x:85,y:32,w:250}].map((c,i) => (
            <div key={i} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, width: c.w, height: 40, background: "rgba(255,255,255,0.12)", borderRadius: 40, filter: "blur(8px)" }} />
          ))}
          {/* HUD overlay */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 1200 600">
            {/* Pitch ladder */}
            {[-10, -5, 0, 5, 10].map(p => (
              <g key={p} transform={`translate(0, ${300 - (p - (sim.pitch)) * 20})`}>
                <line x1="440" y1="300" x2="540" y2="300" stroke="rgba(0,255,150,0.6)" strokeWidth="1.5" />
                <line x1="660" y1="300" x2="760" y2="300" stroke="rgba(0,255,150,0.6)" strokeWidth="1.5" />
                <text x="430" y="304" textAnchor="end" fill="rgba(0,255,150,0.6)" fontSize="12" fontFamily="monospace">{p}</text>
              </g>
            ))}
            {/* Bank angle indicator */}
            <g transform={`translate(600, 300) rotate(${sim.roll})`}>
              <line x1="0" y1="-200" x2="0" y2="-185" stroke="rgba(0,255,150,0.8)" strokeWidth="2" />
              <polygon points="0,-178 -5,-190 5,-190" fill="rgba(0,255,150,0.8)" />
            </g>
            {/* Velocity vector */}
            <circle cx="600" cy={300 - sim.pitch * 5} r="12" fill="none" stroke="rgba(0,255,150,0.9)" strokeWidth="1.5" />
            <line x1={600 - 20} y1={300 - sim.pitch * 5} x2={600 - 12} y2={300 - sim.pitch * 5} stroke="rgba(0,255,150,0.9)" strokeWidth="1.5" />
            <line x1={600 + 12} y1={300 - sim.pitch * 5} x2={600 + 20} y2={300 - sim.pitch * 5} stroke="rgba(0,255,150,0.9)" strokeWidth="1.5" />
            <line x1="600" y1={300 - sim.pitch * 5 - 20} x2="600" y2={300 - sim.pitch * 5 - 12} stroke="rgba(0,255,150,0.9)" strokeWidth="1.5" />
            {/* FPV box */}
            <rect x="460" y="255" width="280" height="90" fill="none" stroke="rgba(0,255,150,0.15)" strokeWidth="1" strokeDasharray="4,4" />
            {/* Speed tape */}
            <rect x="30" y="150" width="60" height="300" fill="rgba(0,0,0,0.4)" rx="3" />
            {[...Array(13)].map((_, i) => {
              const spd = Math.round(sim.speed / 10) * 10 - 60 + i * 10;
              const y = 300 - (spd - sim.speed) * 3;
              if (y < 155 || y > 445) return null;
              return (
                <g key={i}>
                  <line x1="75" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <text x="72" y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">{spd}</text>
                </g>
              );
            })}
            <rect x="25" y="290" width="70" height="22" fill="rgba(0,0,0,0.7)" rx="2" stroke="rgba(0,255,150,0.5)" strokeWidth="1" />
            <text x="60" y="305" textAnchor="middle" fill="#0f6" fontSize="14" fontFamily="monospace" fontWeight="bold">{Math.round(sim.speed)}</text>
            {/* Altitude tape */}
            <rect x="1110" y="150" width="60" height="300" fill="rgba(0,0,0,0.4)" rx="3" />
            {[...Array(11)].map((_, i) => {
              const alt = Math.round(sim.altitude / 100) * 100 - 500 + i * 100;
              const y = 300 - (alt - sim.altitude) * 0.3;
              if (y < 155 || y > 445) return null;
              return (
                <g key={i}>
                  <line x1="1110" y1={y} x2="1125" y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <text x="1128" y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">{alt}</text>
                </g>
              );
            })}
            <rect x="1105" y="290" width="70" height="22" fill="rgba(0,0,0,0.7)" rx="2" stroke="rgba(0,255,150,0.5)" strokeWidth="1" />
            <text x="1140" y="305" textAnchor="middle" fill="#0f6" fontSize="14" fontFamily="monospace" fontWeight="bold">{Math.round(sim.altitude)}</text>
            {/* Heading tape */}
            <rect x="430" y="530" width="340" height="40" fill="rgba(0,0,0,0.5)" rx="3" />
            {[...Array(13)].map((_, i) => {
              const hdg = ((Math.round(sim.heading / 5) * 5 - 30 + i * 5) + 360) % 360;
              const x = 600 - (hdg - sim.heading) * 8;
              if (x < 435 || x > 765) return null;
              return (
                <g key={i}>
                  <line x1={x} y1="532" x2={x} y2="542" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <text x={x} y="558" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">{hdg}</text>
                </g>
              );
            })}
            <rect x="585" y="530" width="30" height="40" fill="rgba(0,0,0,0.7)" rx="2" stroke="rgba(0,255,150,0.5)" strokeWidth="1" />
            <text x="600" y="554" textAnchor="middle" fill="#0f6" fontSize="12" fontFamily="monospace" fontWeight="bold">{Math.round(sim.heading)}</text>
            <polygon points="600,528 596,533 604,533" fill="#ff0" />
          </svg>
        </div>

        {/* Left instrument panel */}
        <div style={{ position: "relative", zIndex: 10, width: 220, background: "rgba(5,5,15,0.88)", borderRight: "1px solid rgba(74,170,255,0.15)", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", padding: 16, gap: 12 }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 3, textAlign: "center", marginBottom: 4 }}>RADIO ◆ NAV</div>
          {[
            { label: "COM 1", value: sim.com1, active: true, color: "#4af" },
            { label: "COM 2", value: sim.com2, active: false, color: "#4af" },
            { label: "NAV 1", value: sim.nav1, active: true, color: "#4f4" },
            { label: "NAV 2", value: sim.nav2, active: false, color: "#4f4" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 4, border: `1px solid ${r.active ? r.color + "44" : "rgba(255,255,255,0.05)"}` }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 1 }}>{r.label}</span>
              <span style={{ color: r.active ? r.color : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 700 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 3, textAlign: "center" }}>TRANSPONDER</div>
          <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px solid rgba(255,165,64,0.2)", textAlign: "center" }}>
            <div style={{ color: "#fa4", fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>1200</div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 2 }}>MODE C · ALT</div>
          </div>
          <div style={{ marginTop: 8, color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 3, textAlign: "center" }}>AUTOPILOT</div>
          {[["HDG", Math.round(sim.heading) + "°", "#fa4"], ["ALT", Math.round(sim.altitude) + "", "#4f4"], ["SPD", Math.round(sim.speed) + "", "#4af"], ["V/S", "+500", "#4af"]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>{l}</span>
              <span style={{ color: c, fontSize: 12, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Right instrument panel */}
        <div style={{ position: "relative", zIndex: 10, width: 220, marginLeft: "auto", background: "rgba(5,5,15,0.88)", borderLeft: "1px solid rgba(74,170,255,0.15)", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", padding: 16, gap: 12 }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 3, textAlign: "center", marginBottom: 4 }}>ENGINE ◆ FUEL</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "10px 0" }}>
            <EngineGauge label="ENG 1 N1" value={sim.throttle[0]} color="#4af" />
            <EngineGauge label="EGT °C" value={72} color="#fa4" />
            <EngineGauge label="ENG 2 N1" value={sim.throttle[1]} color="#4af" />
          </div>
          {[
            { label: "FUEL L", value: Math.round(sim.fuel[0]) + " LBS", color: "#4f4" },
            { label: "FUEL R", value: Math.round(sim.fuel[1]) + " LBS", color: "#4f4" },
            { label: "OIL PRESS", value: "68 PSI", color: "#4af" },
            { label: "OIL TEMP", value: "92 °C", color: "#fa4" },
            { label: "HYD 1", value: "3000 PSI", color: "#4af" },
            { label: "FLAPS", value: sim.flaps + "°", color: "#fff" },
            { label: "GEAR", value: sim.gear, color: sim.gear === "DOWN" ? "#4f4" : "#fa4" },
          ].map(({ label, value, color }) => (
            <PFDStrip key={label} label={label} value={value} color={color} />
          ))}
          <div style={{ marginTop: "auto", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px solid rgba(74,255,74,0.2)" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: 2, marginBottom: 4 }}>WAYPOINT</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#4af", fontSize: 16, fontWeight: 900 }}>{sim.waypoint}</span>
              <span style={{ color: "#4f4", fontSize: 12 }}>ETA {sim.eta}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, marginTop: 2 }}>
              {sim.lat.toFixed(3)}°N {Math.abs(sim.lon).toFixed(3)}°W
            </div>
          </div>
        </div>
      </div>

      {/* Bottom instrument cluster */}
      <div style={{ background: "rgba(5,5,15,0.95)", borderTop: "1px solid rgba(74,170,255,0.2)", padding: "16px 32px", display: "flex", justifyContent: "center", gap: 32, alignItems: "center" }}>
        <AirspeedIndicator speed={sim.speed} />
        <ArtificialHorizon pitch={sim.pitch} roll={sim.roll} />
        <Altimeter altitude={sim.altitude} />
        <HeadingIndicator heading={sim.heading} />
        <VSI vsi={sim.vsi} />
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 24px", background: "rgba(0,0,0,0.8)", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", letterSpacing: 1 }}>
        <span>LNAV ● VNAV ● TOGA ● A/T ARM</span>
        <span>FMC ACTIVE · ROUTE LOADED · NO WARNINGS</span>
        <span>SIM RATE 1× · WEATHER LIVE · AI TRAFFIC ON</span>
      </div>
    </div>
  );
}