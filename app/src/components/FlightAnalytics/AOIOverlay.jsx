import React from "react";

export default function AOIOverlay({ aois, visible = true }) {
  if (!visible || !aois?.length) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
      {aois.map((aoi) => (
        <div
          key={aoi.id}
          style={{
            position: "absolute",
            left: aoi.x,
            top: aoi.y,
            width: aoi.width,
            height: aoi.height,
            border: `1px dashed ${aoi.color.replace("0.18", "0.65").replace("0.22", "0.65")}`,
            background: aoi.color,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 4,
              top: 4,
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 11,
              color: "#fff",
              background: "rgba(0,0,0,0.5)",
              fontFamily: "monospace",
            }}
          >
            {aoi.label}
          </div>
        </div>
      ))}
    </div>
  );
}