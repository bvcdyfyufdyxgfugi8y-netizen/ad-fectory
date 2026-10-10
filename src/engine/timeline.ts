import type { Scene, Storyboard } from "../core/schema.ts";
import { settings } from "./config.ts";

export function timeline(scenes: Scene[], transitionFrames = 10) {
  let cut = 0;
  return scenes.map((scene, index) => {
    const lead = index === 0 ? 0 : transitionFrames;
    const entry = { scene, index, cut, from: cut - lead, lead, duration: scene.durationInFrames + lead };
    cut += scene.durationInFrames;
    return entry;
  });
}
export function soundCues(scenes: Scene[], fps: number, bpm: number, transitionFrames = 10): Storyboard["audio"]["sfx"] {
  const fpb = Math.round(fps * 60 / bpm);
  const cues: Storyboard["audio"]["sfx"] = [];
  for (const { scene: s, index, cut, from } of timeline(scenes, transitionFrames)) {
    if (index && s.transition !== "none") cues.push({ frame: from, sound: "whoosh", gainDb: -9 });
    if (s.kind === "hook") cues.push({ frame: from + 4, sound: "pop", gainDb: -10 });
    if (s.kind === "reveal") cues.push({ frame: from + 2, sound: "impact", gainDb: -6 });
    if (s.kind === "benefit") cues.push({ frame: from + 12, sound: "tick", gainDb: -12 });
    if (s.kind === "offer") cues.push({ frame: from + 8, sound: "impact", gainDb: -5 });
    if (s.kind === "cta") cues.push({ frame: Math.max(0, cut - 2 * fpb), sound: "riser", gainDb: -12 });
  }
  return cues.sort((a, b) => a.frame - b.frame);
}
export const storyboardTimeline = (sb: Storyboard) => timeline(sb.scenes, settings(sb.engine).animation.transitionFrames);
