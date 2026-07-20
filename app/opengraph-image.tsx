import { ImageResponse } from "next/og";

export const alt = "bookme — one link, every calendar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RAINBOW = ["#61bb46", "#fdb827", "#f5821f", "#e03a3e", "#963d97", "#009ddc"];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f0e5",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 200,
            height: 190,
            borderRadius: 32,
            border: "8px solid #1a1a1a",
            background: "#fffdf7",
            overflow: "hidden",
            boxShadow: "14px 14px 0 #1a1a1a",
          }}
        >
          <div
            style={{
              display: "flex",
              height: 62,
              background: "#e03a3e",
              borderBottom: "8px solid #1a1a1a",
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 76,
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            17
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 100,
            fontWeight: 800,
            color: "#1a1a1a",
            marginTop: 42,
            letterSpacing: -3,
          }}
        >
          bookme
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#57534a",
            marginTop: 6,
          }}
        >
          one link · every calendar · zero double-bookings
        </div>
        <div style={{ display: "flex", marginTop: 46, borderRadius: 6, overflow: "hidden" }}>
          {RAINBOW.map((c) => (
            <div key={c} style={{ display: "flex", width: 64, height: 14, background: c }} />
          ))}
        </div>
      </div>
    ),
    size
  );
}
