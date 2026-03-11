import React from "react";

export default function GazeDot({ point }) {
  if (!point) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: point.x - 8,
        top: point.y - 8,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "rgba(0,255,255,0.85)",
        border: "2px solid rgba(255,255,255,0.95)",
        boxShadow: "0 0 18px rgba(0,255,255,0.9)",
        pointerEvents: "none",
        zIndex: 35,
      }}
    />
  );
}