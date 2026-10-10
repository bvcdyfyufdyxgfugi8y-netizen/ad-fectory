// Draft → timed Storyboard. Scene lengths are whole beats, so every cut lands on the music's beat grid.
import type { Brief, Scene, Storyboard } from "../core/schema.ts";
import { StoryboardSchema } from "../core/schema.ts";
import { settings } from "../engine/config.ts";
import { templateDefinition } from "../engine/templates.ts";
import { soundCues } from "../engine/timeline.ts";
import type { CreativeDraft, DraftScene } from "../creative/director.ts";

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;
export const BPM = 120;                      // 0.5 s per beat = 15 frames at 30 fps
export const TRANSITION_FRAMES = 10;         // a transition plays over the last frames before its cut

const WEIGHT: Record<Scene["kind"], number> = { hook: 2, problem: 2, reveal: 2.6, benefit: 2, offer: 2.2, cta: 2.8 };

/** Seconds a viewer needs to read a line: a floor so short ads never flash text. */
export function readingSeconds(text: string, lang: Brief["language"]): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return 0.7 + words * (lang === "ar" ? 0.32 : 0.28);
}

/**
 * Split `totalBeats` across scenes in proportion to their weights, never below each scene's reading floor,
 * using largest-remainder rounding so the beats add up exactly.
 */
export function allocateBeats(weights: number[], minBeats: number[], totalBeats: number): number[] {
  const floorSum = minBeats.reduce((a, b) => a + b, 0);
  if (floorSum > totalBeats) throw new Error(`text needs ${floorSum} beats but the ad only has ${totalBeats}: shorten copy or lengthen the ad`);
  const spare = totalBeats - floorSum;
  const wSum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / wSum) * spare);
  const out = raw.map((r, i) => minBeats[i]! + Math.floor(r));
  let left = totalBeats - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k]![1]]! += 1;
  return out;
}

export function buildStoryboard(brief: Brief, draft: CreativeDraft): Storyboard {
  const cfg = settings(brief.engine);
  const tpl = templateDefinition(cfg.template);
  const framesPerBeat = (tpl.fps * 60) / cfg.bpm;
  if (!Number.isInteger(framesPerBeat)) throw new Error("BPM must produce an integer frame beat grid");
  const totalBeats = Math.round((brief.durationSec * VIDEO.fps) / framesPerBeat);
  const floor = (s: DraftScene) =>
    Math.max(2, Math.ceil((readingSeconds(`${s.headline} ${s.sub ?? ""}`, brief.language) * VIDEO.fps) / framesPerBeat));
  // Short ads cannot hold every benefit at a readable pace: drop the last benefits (never the first) until it fits.
  const planned = [...draft.scenes];
  const sum = () => planned.reduce((a, s) => a + floor(s), 0);
  while (sum() > totalBeats && planned.filter((s) => s.kind === "benefit").length > 1)
    planned.splice(planned.map((s) => s.kind).lastIndexOf("benefit"), 1);
  const beats = allocateBeats(planned.map((s) => WEIGHT[s.kind]), planned.map(floor), totalBeats);

  const scenes: Scene[] = planned.map((s, i) => ({ ...s, ...(cfg.cameras?.[s.kind] ? { camera: cfg.cameras[s.kind] } : {}), id: `s${i + 1}-${s.kind}`, durationInFrames: beats[i]! * framesPerBeat }));
  const durationInFrames = scenes.reduce((a, s) => a + s.durationInFrames, 0);

  const sfx = soundCues(scenes, VIDEO.fps, cfg.bpm, cfg.animation.transitionFrames);

  return StoryboardSchema.parse({
    id: `${brief.id}-v1`,
    briefId: brief.id,
    template: cfg.template,
    ...(brief.engine ? { engine: cfg } : {}),
    strategy: draft.strategy,
    language: brief.language,
    direction: brief.language === "ar" ? "rtl" : "ltr",
    ...VIDEO,
    bpm: cfg.bpm,
    durationInFrames,
    hooks: draft.hooks,
    selectedHook: draft.selectedHook,
    brand: { name: brief.client.brand, handle: brief.client.handle, logo: brief.brand.logo, colors: brief.brand.colors },
    scenes,
    audio: { musicSeed: hashSeed(brief.id), sfx: sfx.sort((a, b) => a.frame - b.frame), voiceover: brief.voiceover.mode === "file" ? brief.voiceover.file : undefined },
    approved: false,
  });
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h % 100000;
}
