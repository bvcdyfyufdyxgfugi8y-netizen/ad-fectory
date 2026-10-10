import type { MotionPreset } from "../../../engine/config.ts";
import { progress, easings } from "../primitives.ts";

/** Three planes with deterministic frame clocks. Independent proposal, not measured source motion. */
export function posterStackState(frame: number, duration: number, preset: MotionPreset) {
  const settle = easings["cubic-out"](progress(frame, 0, preset.settleFrames));
  const hold = progress(frame, preset.settleFrames, duration - 1);
  return [2, 1, 0].map(layer => {
    const sign = layer === 2 ? -1 : 1;
    const reveal = easings["cubic-out"](progress(frame, layer * 6, preset.settleFrames + layer * 6));
    return {
      layer, opacity: reveal,
      x: layer * preset.offset * sign * settle + hold * layer * 3,
      y: (1 - reveal) * 90 + layer * 15 - hold * (3 - layer) * 5,
      rotation: layer * preset.tiltDegrees * sign * settle / 2,
      scale: 1 - layer * 0.035 + hold * (layer === 0 ? 0.015 : 0.005),
    };
  });
}
