import type { Brief, Storyboard } from "../core/schema.ts";
import { StoryboardSchema } from "../core/schema.ts";
import { contrast } from "../remotion/templates/bold-commercial/theme.ts";
import { settings, CameraSchema } from "../engine/config.ts";
import { validatePlan } from "../engine/validate.ts";
import { storyboardTimeline, soundCues } from "../engine/timeline.ts";
import { buildStoryboard } from "../storyboard/build.ts";
import { ruleBasedDirector } from "./director.ts";
import { DirectionReportSchema, type Technique, type DirectionReport } from "./contracts.ts";

/** Browser-safe evaluator. Category names never determine motion or introduce physical facts. */
export function evaluateTechnique(brief: Brief, t: Technique): DirectionReport["decisions"][number] {
  const profile = brief.creative?.profile;
  const reasons: string[] = [];
  const intensity = brief.creative?.intensity ?? (brief.tone === "fast" || brief.tone === "funny" ? 0.8 : brief.tone === "luxury" ? 0.25 : 0.45);
  const executable = !t.requires.includes("true-3d") && t.status === "approved" && ["camera", "kinetic", "transition"].includes(t.executor ?? "") && t.testEvidence.length > 0;
  if (!executable) reasons.push("Not an approved, tested executor in the current engine");
  let compatible = true;
  for (const req of t.requires) {
    const met = req === "multiple-assets" ? brief.product.images.length > 1 : req === "physical-depth" ? !!profile?.dimensions?.depth : req === "reflective-material" ? profile?.material === "reflective" : false;
    if (!met) { compatible = false; reasons.push(`Missing requirement: ${req}`); }
  }
  const restrained = brief.tone === "luxury" || brief.tone === "informative";
  const brand = t.tones.includes(brief.tone) ? 90 : 35;
  const textContrast = contrast(brief.brand.colors.text, brief.brand.colors.background);
  const clarity = t.family === "depth" ? (profile?.shape === "irregular" ? 35 : 65) : t.family === "camera" ? 90 - intensity * 20 : 90;
  const goal = t.family === "type" ? (brief.goal === "sell" || brief.goal === "engagement" ? 95 : 80) : t.family === "camera" ? (brief.goal === "launch" || brief.goal === "awareness" ? 95 : 80) : 85;
  const scores = { productCompatibility: compatible ? 90 : 0, brandIdentity: brand, visualClarity: textContrast < 4.5 ? Math.min(clarity, 40) : clarity, marketingObjective: goal, technicalFeasibility: executable ? 100 : 0, audienceAppeal: 50, motionAudioHarmony: restrained && intensity > 0.7 ? 40 : 90 };
  reasons.push(`Brand text contrast=${textContrast.toFixed(2)}:1; colors come only from the target brief`);
  reasons.push("Audience supplied by the brief; appeal is unmeasured (neutral score)", `Goal=${brief.goal}; tone=${brief.tone}; readability and authored beat grid constrain motion`);
  const score = Object.values(scores).reduce((a, b) => a + b, 0) / 7;
  return { techniqueId: t.id, score, scores, selected: executable && compatible && score >= 65 && brand >= 50 && scores.visualClarity >= 50 && scores.motionAudioHarmony >= 50, reasons };
}

/** Adapts the existing director, allocator, camera primitives and audio clock; no alternate render pipeline. */
export function adaptStoryboard(brief: Brief, techniques: Technique[]): Storyboard {
  const opts = brief.creative;
  if (!opts) return buildStoryboard(brief, ruleBasedDirector.draft(brief));
  if (opts.lightingStyle !== "template") throw new Error("Custom lighting is not implemented; use template lighting or supply pre-lit owned assets");
  const cfg = settings(brief.engine);
  const intensity = opts.intensity ?? (brief.tone === "fast" || brief.tone === "funny" ? 0.8 : brief.tone === "luxury" ? 0.25 : 0.45);
  const decisions = techniques.map(t => evaluateTechnique(brief, t));
  // One executor per family avoids conflicting cameras/transitions when multiple references contribute.
  const selected: Technique[] = [];
  for (const d of decisions.filter(d => d.selected).sort((a, b) => b.score - a.score || a.techniqueId.localeCompare(b.techniqueId))) {
    const t = techniques.find(t => t.id === d.techniqueId)!;
    if (selected.some(s => s.family === t.family)) { d.selected = false; d.reasons.push("A higher-ranked technique already owns this motion family"); } else selected.push(t);
  }
  if (!selected.length) throw new Error("No compatible approved motion techniques: review contrast, intensity and brand constraints before production");
  const has = (executor: string) => selected.some(t => t.executor === executor);
  if (has("kinetic")) cfg.animation.kineticSpring = { damping: 24 - intensity * 10, stiffness: 110 + intensity * 80, mass: 0.9 };
  cfg.animation.floatAmplitude = 2 + intensity * 10;
  cfg.animation.floatPeriod = 28 - intensity * 10;
  const aspect = opts.profile.assetAspect ?? (opts.profile.dimensions ? opts.profile.dimensions.width / opts.profile.dimensions.height : undefined);
  const shape = opts.profile.shape === "unknown" && aspect ? (aspect < 0.75 ? "tall" : aspect > 1.35 ? "wide" : "square") : opts.profile.shape;
  if (aspect || shape !== "unknown") {
    const height = Math.round(Math.min(860, 850 / Math.max(aspect ?? (shape === "wide" ? 1.6 : shape === "tall" ? 0.6 : 1), 1)));
    cfg.layout.product = { reveal: Math.max(100, height), benefit: Math.max(100, Math.round(height * 0.84)), cta: Math.max(100, Math.round(height * 0.75)) };
  }
  // Copy, marketing facts and owned images are drafted exclusively from the target brief.
  const sb = buildStoryboard({ ...brief, engine: cfg }, ruleBasedDirector.draft(brief));
  const direction = opts.cameraDirection ?? (brief.tone === "luxury" ? "pull-out" : "push-in");
  for (const s of sb.scenes) {
    if (has("transition") && s.kind !== "hook") s.transition = opts.transition ?? (brief.tone === "fast" || brief.tone === "funny" ? "slide-up" : "fade");
    if (has("camera") && s.image && !s.camera && direction !== "still") {
      const shift = 18 * intensity;
      s.camera = CameraSchema.parse({ from: { scale: direction === "pull-out" ? 1 + intensity * 0.07 : 1 }, to: { scale: direction === "push-in" ? 1 + intensity * 0.07 : 1, x: direction === "left" ? -shift : direction === "right" ? shift : 0 }, endFrame: s.durationInFrames - 1, easing: "cubic-in-out" });
    }
  }
  sb.audio.sfx = opts.audio === "quiet" ? [] : soundCues(sb.scenes, sb.fps, sb.bpm, cfg.animation.transitionFrames);
  const limitations = ["Rule-based creative selection; audience appeal and commercial impact are not measured", "One implemented visual template; true 3D, new grid and cartoon recipes are not automatic production presets", "Reference audio BPM/easing are not inferred; synchronization uses the engine's authored beat grid", "Asset aspect and physical dimensions are supplied facts; pixels do not prove physical material or depth"];
  const bindings = storyboardTimeline(sb).map(({ scene, from, duration }) => ({ sceneId: scene.id, techniqueIds: selected.filter(t => t.executor === "camera" ? !!scene.camera : t.executor === "transition" ? scene.transition !== "none" : ["hook", "benefit"].includes(scene.kind)).map(t => t.id), asset: scene.image, category: brief.product.category, dimensions: opts.profile.dimensions, assetAspect: aspect, brandColors: brief.brand.colors, typography: opts.typography, durationInFrames: scene.durationInFrames, intensity, cameraDirection: scene.camera ? (cfg.cameras?.[scene.kind] ? "authored-camera" : direction) : "still", lightingStyle: "template" as const, audioCues: sb.audio.sfx.filter(c => c.frame >= from && c.frame < from + duration).map(c => ({ frame: c.frame, sound: c.sound })), transition: scene.transition }));
  sb.creativeDirection = DirectionReportSchema.parse({ version: 1, targetProduct: brief.product.name, category: brief.product.category, audience: brief.audience, goal: brief.goal, profile: opts.profile, primaryFeature: brief.product.features[0], intensity, decisions, bindings, limitations });
  validatePlan(sb, brief);
  return StoryboardSchema.parse(sb);
}
