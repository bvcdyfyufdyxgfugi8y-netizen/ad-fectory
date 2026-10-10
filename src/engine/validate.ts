import type { Brief, Storyboard } from "../core/schema.ts";
import { settings } from "./config.ts";
import { templateDefinition } from "./templates.ts";
import { storyboardTimeline } from "./timeline.ts";

/** Production boundary: reject invalid edits before any audio, bundling or cache access. */
export function validatePlan(sb: Storyboard, brief?: Brief): void {
  const cfg = settings(sb.engine);
  const tpl = templateDefinition(sb.template);
  const errors: string[] = [];
  if (cfg.template !== sb.template || cfg.bpm !== sb.bpm) errors.push("engine template/BPM must match storyboard");
  if (sb.width !== tpl.width || sb.height !== tpl.height || sb.fps !== tpl.fps) errors.push("template supports only 1080×1920 at 30 fps");
  const fpb = sb.fps * 60 / sb.bpm;
  if (!Number.isInteger(fpb)) errors.push("BPM must produce an integer frame beat grid");
  if (sb.durationInFrames !== sb.scenes.reduce((n, s) => n + s.durationInFrames, 0)) errors.push("scene durations must sum to durationInFrames");
  if (sb.durationInFrames / sb.fps < 10 || sb.durationInFrames / sb.fps > 30) errors.push("ad duration must be 10–30 seconds");
  if (new Set(sb.scenes.map(s => s.id)).size !== sb.scenes.length) errors.push("scene IDs must be unique");
  if (sb.scenes[0]?.kind !== "hook" || sb.scenes.at(-1)?.kind !== "cta") errors.push("hook first and CTA last required");
  for (const { scene: s, from, duration } of storyboardTimeline(sb)) {
    if (from < 0 || s.durationInFrames <= cfg.animation.transitionFrames || s.durationInFrames % fpb) errors.push(`${s.id}: duration/transition is not on beat grid`);
    const words = `${s.headline} ${s.sub ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
    if (!s.headline.trim() || s.headline.length > 120 || (s.sub?.length ?? 0) > 120 || s.durationInFrames / sb.fps < 0.7 + words * (sb.language === "ar" ? 0.32 : 0.28)) errors.push(`${s.id}: unreadable text/duration`);
    if (!(tpl.motions[s.kind] as readonly string[]).includes(s.motion)) errors.push(`${s.id}: unsupported motion ${s.motion}`);
    if (s.emphasis.some(i => i >= s.headline.split(/[ \t\n]+/).filter(Boolean).length)) errors.push(`${s.id}: emphasis outside text`);
    if (cfg.motionPreset?.applyTo.includes(s.kind as "reveal" | "benefit") && cfg.motionPreset.settleFrames + 12 >= duration) errors.push(`${s.id}: preset settling exceeds scene clock`);
    if (s.camera && s.camera.endFrame >= duration) errors.push(`${s.id}: camera exceeds scene clock`);
    if (!s.source.length) errors.push(`${s.id}: content source required`);
    if (brief && s.image && !brief.product.images.includes(s.image)) errors.push(`${s.id}: image must belong to product`);
  }
  if (sb.audio.sfx.some(c => c.frame >= sb.durationInFrames)) errors.push("SFX cue outside timeline");
  if (brief && (sb.brand.logo !== brief.brand.logo || sb.audio.voiceover !== (brief.voiceover.mode === "file" ? brief.voiceover.file : undefined))) errors.push("logo/voiceover must belong to brief");
  if (errors.length) throw new Error(`Invalid render plan:\n${errors.join("\n")}`);
}
