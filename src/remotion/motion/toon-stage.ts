import { interpolate } from "remotion";
import type { ToonMotion } from "../../engine/config.ts";
import { clamp, floatOffset, progress } from "./primitives.ts";

/** Product-independent paper-slice assembly and continuous planar hero staging. */
export function toonStage(frame: number, duration: number, cut: number, finalCut: number, framesPerBeat: number, options: ToonMotion) {
  const f = Math.max(0, Math.min(duration - 1, frame));
  const middle = progress(f, cut, Math.max(cut + 1, cut + framesPerBeat * 2), "cubic-in-out");
  const final = progress(f, finalCut, Math.max(finalCut + 1, finalCut + framesPerBeat * 2), "cubic-in-out");
  const bob = floatOffset(f, 9 * (1 - final), framesPerBeat);
  const pieces = Array.from({ length: 4 }, (_, i) => {
    const t = progress(f, i * framesPerBeat / 5, options.assemblyBeats * framesPerBeat + i * framesPerBeat / 5, "cubic-out");
    return { index: i, x: (1 - t) * (i % 2 ? 520 : -520), y: (1 - t) * (i - 1.5) * 110, rotation: (1 - t) * (i % 2 ? 14 : -14), opacity: progress(f, i * framesPerBeat / 5, i * framesPerBeat / 5 + framesPerBeat / 2) };
  });
  return {
    x: -100 * middle * (1 - final), y: 10 - 80 * middle + 80 * final + bob,
    scale: 0.94 + 0.19 * middle - 0.13 * final,
    rotation: -9 + 15 * middle - 6 * final,
    pieces,
    burst: progress(f, cut - framesPerBeat, cut + framesPerBeat, "cubic-out"),
    orbit: progress(f, cut, finalCut) * Math.PI * 2 * options.orbitTurns,
    wave: interpolate(f, [finalCut - framesPerBeat, finalCut + framesPerBeat], [0, 1], clamp),
  };
}
