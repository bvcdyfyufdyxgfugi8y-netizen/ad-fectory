import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../src/core/exec.ts";
import { loadBrief } from "../src/intake/loadBrief.ts";
import { plan } from "../src/server/editor.ts";
import { settings, MotionPresetSchema } from "../src/engine/config.ts";
import { validatePlan } from "../src/engine/validate.ts";
import { posterStackState } from "../src/remotion/motion/presets/poster-stack.ts";
import { storyboardTimeline } from "../src/engine/timeline.ts";
import { audioCacheKey } from "../src/audio/mix.ts";
import { videoCacheKey } from "../src/render/render.ts";

test("poster preset is opt-in and existing demo plans remain byte-for-byte JSON equivalent", () => {
  assert.equal(settings().motionPreset, undefined);
  for (const [demo, sample] of [["demo-nafas", "samples/engine-regression/before-storyboard.json"], ["demo-mint", "samples/engine-products/mint/storyboard.json"]]) {
    const { brief } = loadBrief(path.join(ROOT, `briefs/${demo}/brief.json`));
    const before = JSON.parse(fs.readFileSync(path.join(ROOT, sample!), "utf8"));
    assert.deepEqual(JSON.parse(JSON.stringify(plan(brief))), before);
  }
});
test("only one named preset and supported scene kinds are accepted with bounded timing and transforms", () => {
  for (const value of [{ name: "grid-to-hero" }, { name: "poster-stack-depth", applyTo: ["cta"] }, { name: "poster-stack-depth", applyTo: ["reveal", "reveal"] }, { name: "poster-stack-depth", settleFrames: 0 }, { name: "poster-stack-depth", offset: 900 }, { name: "poster-stack-depth", tiltDegrees: 20 }, { name: "poster-stack-depth", surprise: true }]) assert.equal(MotionPresetSchema.safeParse(value).success, false);
  const { brief } = loadBrief(path.join(ROOT, "briefs/demo-reference-001/brief.json"));
  const sb = plan(brief); validatePlan(sb, brief);
  const row = storyboardTimeline(sb).find(r => r.scene.kind === "reveal")!;
  const oldDuration = row.scene.durationInFrames;
  row.scene.durationInFrames = 45;
  sb.scenes.at(-1)!.durationInFrames += oldDuration - 45;
  sb.engine!.motionPreset!.settleFrames = 60;
  assert.throws(() => validatePlan(sb), /preset settling exceeds scene clock/);
});
test("poster stack stays finite, clamps outside timeline and settles all planes before scene end", () => {
  const preset = MotionPresetSchema.parse({ name: "poster-stack-depth" });
  const initial = posterStackState(-10, 75, preset);
  assert.ok(initial.every(s => s.opacity === 0));
  assert.deepEqual(initial.map(s => s.layer), [2, 1, 0]);
  assert.ok(posterStackState(36, 75, preset).every(s => s.opacity === 1));
  for (let frame = 0; frame < 75; frame++) {
    for (const s of posterStackState(frame, 75, preset)) {
      assert.ok(Object.values(s).every(Number.isFinite));
      assert.ok(s.opacity >= 0 && s.opacity <= 1);
      assert.ok(Math.abs(s.x) <= 80 && Math.abs(s.rotation) <= 6);
      assert.ok(s.scale >= 0.93 - 1e-9 && s.scale <= 1.02 + 1e-9);
    }
  }
  assert.deepEqual(posterStackState(100, 75, preset), posterStackState(74, 75, preset));
});
test("preset changes picture only and preserves the complete scene/audio timeline", () => {
  const { brief, dir } = loadBrief(path.join(ROOT, "briefs/demo-mint/brief.json"));
  const before = plan(brief), after = structuredClone(before);
  after.engine!.motionPreset = MotionPresetSchema.parse({ name: "poster-stack-depth" });
  validatePlan(after, brief);
  assert.deepEqual(storyboardTimeline(before), storyboardTimeline(after));
  assert.equal(audioCacheKey(before, dir), audioCacheKey(after, dir));
  assert.notEqual(videoCacheKey(before, dir, false), videoCacheKey(after, dir, false));
  assert.deepEqual(before.audio, after.audio);
});
