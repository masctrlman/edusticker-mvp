import React from "react";

export default function WiggleSticker({ src, name }: { src: string; name: string }) {
  return (
    <div style={{ display: "inline-block", animation: "wiggle 1.2s ease-in-out infinite", margin: 6, textAlign: "center" }}>
      <style>{`@keyframes wiggle { 0%, 100% { transform: rotate(-4deg) scale(1); } 50% { transform: rotate(4deg) scale(1.06); } }`}</style>
      <img
        src={src}
        alt={name}
        style={{
          width: 84,
          height: 84,
          objectFit: "contain",
          border: "4px solid #fff",
          borderRadius: "18px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
          background: "#fff"
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{name}</div>
    </div>
  );
}