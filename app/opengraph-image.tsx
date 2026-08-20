import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#FAF8F5",
          color: "#18110A",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6 }}>brewtogether</div>
        <div style={{ fontSize: 72, lineHeight: 1.1, marginTop: 16 }}>The café where strangers study together</div>
        <div style={{ fontSize: 28, marginTop: 24, color: "#7C5C3E" }}>No video. No pressure. Free during launch.</div>
      </div>
    ),
    size
  );
}
