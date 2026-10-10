import { interpolate, spring } from "remotion";
import type { Camera, EngineConfig } from "../../engine/config.ts";
import type { CSSProperties } from "react";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easings = { linear: (t: number) => t, "cubic-out": (t: number) => 1 - (1 - t) ** 3, "cubic-in-out": (t: number) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2 };
export function progress(frame: number, start: number, end: number, easing: keyof typeof easings = "linear") {
  return interpolate(frame, [start, end], [0, 1], { ...clamp, easing: easings[easing] });
}
export function zoom(frame: number, duration: number, from = 1, to = 1.07) {
  return interpolate(frame, [0, duration], [from, to]);
}
export const parallax = (frame: number, origin: number, speed: number) => origin + frame * speed;
export const floatOffset = (frame: number, amplitude = 10, period = 18) => Math.sin(frame / period) * amplitude;
export const kineticSpring = (frame: number, fps: number, config: EngineConfig["animation"]["kineticSpring"]) => spring({ frame, fps, config });
export function cameraStyle(frame: number, camera: Camera): CSSProperties {
  const p = progress(frame, camera.startFrame, camera.endFrame, camera.easing);
  const value = (key: keyof Camera["from"]) => interpolate(p, [0, 1], [camera.from[key], camera.to[key]]);
  return { transform: `perspective(${camera.perspective}px) translate(${value("x")}px, ${value("y")}px) scale(${value("scale")}) rotateX(${value("rotateX")}deg) rotateY(${value("rotateY")}deg) rotateZ(${value("rotateZ")}deg)`, transformStyle: "preserve-3d" };
}
export function transitionStyle(frame: number, duration: number, kind: string, dir: "rtl" | "ltr"): CSSProperties {
  const p = progress(frame, 0, duration, "cubic-out");
  if (kind === "none" || p >= 1) return {};
  if (kind === "wipe") {
    const x = (1 - p) * 130;
    return { clipPath: dir === "rtl" ? `polygon(${x}% 0, 100% 0, 100% 100%, ${x - 30}% 100%)` : `polygon(0 0, ${100 - x + 30}% 0, ${100 - x}% 100%, 0 100%)` };
  }
  if (kind === "slide-up") return { transform: `translateY(${(1 - p) * 100}%)`, filter: p < 0.9 ? `blur(${(1 - p) * 10}px)` : undefined };
  if (kind === "zoom") return { transform: `scale(${interpolate(p, [0, 1], [1.5, 1])})`, opacity: p };
  return { opacity: p };
}
