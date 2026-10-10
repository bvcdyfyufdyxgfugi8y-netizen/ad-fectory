import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ROOT } from "../src/core/exec.ts";
import { loadBrief, checkAssets } from "../src/intake/loadBrief.ts";
import { StoryboardSchema } from "../src/core/schema.ts";
import { plan, editStoryboard } from "../src/server/editor.ts";
import { EngineConfigSchema, CameraSchema } from "../src/engine/config.ts";
import { validatePlan } from "../src/engine/validate.ts";
import { storyboardTimeline, soundCues } from "../src/engine/timeline.ts";
import { cameraStyle, progress, transitionStyle } from "../src/remotion/motion/primitives.ts";
import { audioCacheKey } from "../src/audio/mix.ts";
import { videoCacheKey } from "../src/render/render.ts";
const nafas = loadBrief(path.join(ROOT, "briefs/demo-nafas/brief.json"));
const mint = loadBrief(path.join(ROOT, "briefs/demo-mint/brief.json"));

test("legacy storyboard and sound timings remain identical to preserved pre-refactor JSON", () => {
  const before = StoryboardSchema.parse(JSON.parse(fs.readFileSync(path.join(ROOT, "samples/engine-regression/before-storyboard.json"), "utf8")));
  assert.deepEqual(JSON.parse(JSON.stringify(plan(nafas.brief))), before);
  validatePlan(before, nafas.brief);
});
test("two products use the same template from data and optional cameras reach the scene", () => {
  for (const { brief } of [nafas, mint]) validatePlan(plan(brief), brief);
  const sb = plan(mint.brief);
  assert.equal(sb.template, plan(nafas.brief).template);
  assert.notEqual(sb.scenes[1]!.image, plan(nafas.brief).scenes[1]!.image);
  assert.ok(sb.scenes[1]!.camera);
  const rows = storyboardTimeline(sb);
  assert.equal(rows[1]!.from, rows[1]!.cut - 12);
  assert.deepEqual(sb.audio.sfx, soundCues(sb.scenes, sb.fps, sb.bpm, 12));
});
test("production rejects corrupt totals, IDs, cues, grid, unsupported templates/motions and assets", () => {
  const mutations: Array<(sb: ReturnType<typeof plan>) => void> = [
    sb => sb.durationInFrames++, sb => { sb.scenes[1]!.id = sb.scenes[0]!.id; },
    sb => { sb.audio.sfx[0]!.frame = sb.durationInFrames; }, sb => { sb.scenes[0]!.durationInFrames++; },
    sb => { sb.template = "toon-style"; }, sb => { sb.scenes[1]!.motion = "stamp"; },
    sb => { sb.scenes[1]!.image = "assets/unknown.svg"; }, sb => { sb.scenes[0]!.headline = ""; },
  ];
  for (const mutate of mutations) { const sb = plan(nafas.brief); mutate(sb); assert.throws(() => validatePlan(sb, nafas.brief)); }
});
test("configuration rejects unknown controls, unsupported exports and invalid camera ranges", () => {
  for (const config of [{ export: { codec: "vp9" } }, { animation: { transitionFrames: 0 } }, { layout: { type: { hook: -1 } } }, { invented: true }]) assert.equal(EngineConfigSchema.safeParse(config).success, false);
  assert.equal(CameraSchema.safeParse({ from: {}, to: {}, startFrame: 20, endFrame: 10 }).success, false);
  const sb = plan(mint.brief); sb.scenes[1]!.camera!.endFrame = 999;
  assert.throws(() => validatePlan(sb), /camera exceeds/);
});
test("camera and transitions clamp at endpoints; RTL/LTR wipes mirror", () => {
  const camera = CameraSchema.parse({ from: { x: -20, scale: 1 }, to: { x: 20, scale: 1.2, rotateY: 10 }, startFrame: 5, endFrame: 25 });
  assert.equal(progress(-1, 5, 25), 0); assert.equal(progress(30, 5, 25), 1);
  assert.match(cameraStyle(0, camera).transform!, /translate\(-20px, 0px\) scale\(1\)/);
  assert.match(cameraStyle(30, camera).transform!, /rotateY\(10deg\)/);
  assert.deepEqual(transitionStyle(10, 10, "wipe", "rtl"), {});
  assert.notDeepEqual(transitionStyle(2, 10, "wipe", "rtl"), transitionStyle(2, 10, "wipe", "ltr"));
});
test("audio-only settings reuse picture; visual settings reuse audio; editor preserves configuration", () => {
  const sb = plan(mint.brief), audio = structuredClone(sb), visual = structuredClone(sb);
  audio.engine!.audio.musicGainDb = -6; audio.engine!.export.audioBitrateK = 256;
  assert.equal(videoCacheKey(sb, mint.dir, false), videoCacheKey(audio, mint.dir, false));
  assert.notEqual(audioCacheKey(sb, mint.dir), audioCacheKey(audio, mint.dir));
  visual.engine!.layout.type.hook = 110;
  assert.notEqual(videoCacheKey(sb, mint.dir, false), videoCacheKey(visual, mint.dir, false));
  assert.equal(audioCacheKey(sb, mint.dir), audioCacheKey(visual, mint.dir));
  const input = structuredClone(sb); input.engine!.animation.transitionFrames = 30;
  assert.deepEqual(editStoryboard(mint.brief, sb, input).storyboard.engine, sb.engine);
});
test("assets reject missing files and symlinks outside the brief folder", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "engine-assets-"));
  try {
    fs.symlinkSync(path.join(nafas.dir, "assets/can.svg"), path.join(dir, "escape.svg"));
    const b = { ...nafas.brief, product: { ...nafas.brief.product, images: ["escape.svg", "missing.svg"] }, brand: { ...nafas.brief.brand, logo: undefined } };
    assert.match(checkAssets(b, dir).join("\n"), /outside the brief folder/);
    assert.match(checkAssets(b, dir).join("\n"), /file not found/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
