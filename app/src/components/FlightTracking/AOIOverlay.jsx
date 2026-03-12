import React from "react";

function softenColor(color = "rgba(127,214,255,0.18)") {
  if (color.includes("0.18")) return color.replace("0.18", "0.08");
  if (color.includes("0.22")) return color.replace("0.22", "0.08");
  if (color.includes("0.2")) return color.replace("0.2", "0.08");
  return color;
}

function borderColor(color = "rgba(127,214,255,0.18)") {
  if (color.includes("0.18")) return color.replace("0.18", "0.3");
  if (color.includes("0.22")) return color.replace("0.22", "0.3");
  if (color.includes("0.2")) return color.replace("0.2", "0.3");
  return color;
}

export default function AOIOverlay({ aois, visible = true }) {
  if (!visible || !aois?.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {aois.map((aoi) => (
        <div
          key={aoi.id}
          style={{
            position: "absolute",
            left: aoi.x,
            top: aoi.y,
            width: aoi.width,
            height: aoi.height,
            border: `1px dashed ${borderColor(aoi.color)}`,
            background: softenColor(aoi.color),
            boxSizing: "border-box",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              padding: "3px 7px",
              borderRadius: 6,
              fontSize: 10,
              lineHeight: 1,
              color: "rgba(255,255,255,0.92)",
              background: "rgba(6,23,43,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "Orbitron, monospace",
              letterSpacing: 0.6,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            {aoi.label}
          </div>
        </div>
      ))}
    </div>
  );
}
