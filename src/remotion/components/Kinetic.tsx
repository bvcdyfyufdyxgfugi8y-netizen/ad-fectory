// Kinetic typography: a line enters word by word on a spring, with a short motion-blur while it moves.
// Words are separate inline blocks, so Arabic letters inside a word stay joined and RTL order is kept by the browser.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { kineticSpring } from "../motion/primitives.ts";
import { useMotionSettings } from "../motion/context.tsx";
import { clamp } from "../templates/bold-commercial/theme.ts";

export const KineticLine: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  size: number;
  color: string;
  weight?: number;
  highlight?: { color: string; ink: string; word: number } | undefined;
  emphasis?: number[];
  from?: "below" | "scale";
  lineHeight?: number;
  dir?: "rtl" | "ltr";
}> = ({ dir = "ltr",  text, delay = 0, stagger = 3, size, color, weight = 800, highlight, emphasis = [], from = "below", lineHeight = 1.25 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = useMotionSettings().animation.kineticSpring;
  const words = text.split(/[ \t\n]+/).filter(Boolean);   // no-break spaces keep a phrase together
  const hlIndex = highlight ? (highlight.word < 0 ? words.length + highlight.word : highlight.word) : -1;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.28}px`, lineHeight }}>
      {words.map((w, i) => {
        const f = frame - delay - i * stagger;
        const s = kineticSpring(f, fps, config);
        const v = kineticSpring(f - 1, fps, config);
        const speed = Math.abs(s - v);                       // per-frame travel → blur amount
        const y = from === "below" ? interpolate(s, [0, 1], [size * 0.9, 0]) : 0;
        const sc = from === "scale" ? interpolate(s, [0, 1], [0.4, 1]) : interpolate(s, [0, 1], [0.92, 1]);
        const isHl = Boolean(highlight) && (emphasis.length ? emphasis.includes(i) : i === hlIndex);
        const bar = isHl ? interpolate(frame - delay - words.length * stagger - 4, [0, 9], [0, 1], clamp) : 0;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              fontSize: size,
              fontWeight: weight,
              color: isHl && bar > 0.5 ? highlight!.ink : color,
              opacity: interpolate(s, [0, 0.35], [0, 1], clamp),
              transform: `translateY(${y}px) scale(${sc})`,
              filter: speed > 0.004 ? `blur(${Math.min(8, speed * 90)}px)` : undefined,
              padding: isHl ? `0 ${size * 0.12}px` : undefined,
            }}
          >
            {isHl && (
              <span
                style={{
                  position: "absolute", inset: `${size * 0.12}px 0 ${size * 0.02}px 0`, background: highlight!.color,
                  borderRadius: size * 0.14, transform: `scaleX(${bar})`, transformOrigin: dir === "rtl" ? "right" : "left", zIndex: -1,
                }}
              />
            )}
            {w}
          </span>
        );
      })}
    </div>
  );
};
