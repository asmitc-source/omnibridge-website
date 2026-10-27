import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function ogCard(title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#070B14",
          color: "#F1F5FB",
          padding: "72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 72,
            width: 420,
            height: 220,
            display: "flex",
            border: "1px solid #22D3EE",
            borderRadius: 28,
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 360,
            width: 280,
            height: 160,
            display: "flex",
            border: "1px solid #8B5CF6",
            borderRadius: 28,
            opacity: 0.7,
          }}
        />
        <div style={{ display: "flex", fontSize: 68, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 980 }}>
          {title}
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
