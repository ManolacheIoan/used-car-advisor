/**
 * Original Open Graph images, generated at build time: text only, brand colours, no logos or car photos.
 * Font: Barlow Semi Condensed (SIL OFL 1.1, assets/fonts/OFL.txt).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

const font = (f: string) => readFile(join(process.cwd(), "assets", "fonts", f));

export async function ogImage({
  title,
  subtitle,
  kicker,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  const [bold, medium] = await Promise.all([
    font("BarlowSemiCondensed-Bold.ttf"),
    font("BarlowSemiCondensed-Medium.ttf"),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 90px",
        background: "#0a0d12",
        color: "#e8eef4",
        fontFamily: "Barlow",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
        <span style={{ color: "#ff8a1f" }}>Alege</span>
        <span>Masina</span>
      </div>
      {kicker && (
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 32,
            color: "#ffa552",
            fontWeight: 500,
          }}
        >
          {kicker}
        </div>
      )}
      <div
        style={{
          display: "flex",
          marginTop: kicker ? 8 : 28,
          fontSize: title.length > 34 ? 74 : 92,
          fontWeight: 700,
          lineHeight: 1.02,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 34,
            color: "#a3b0be",
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 16,
          background: "#ff8a1f",
          display: "flex",
        }}
      />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Barlow", data: bold, weight: 700, style: "normal" },
        { name: "Barlow", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
