import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BriefSchema } from "../src/core/schema.ts";
import { loadBrief } from "../src/intake/loadBrief.ts";
import { creativeMode } from "../src/intake/creative-mode.ts";
import { ROOT } from "../src/core/exec.ts";
import { planProduction } from "../src/creative/plan.ts";
import { adaptStoryboard, evaluateTechnique } from "../src/creative/adaptation.ts";
import { ruleBasedDirector } from "../src/creative/director.ts";
import { buildStoryboard } from "../src/storyboard/build.ts";
import { openReferenceMemory, CreativeMemorySchema, recordCreativeFeedback, analysisCoverage } from "../src/creative/reference-memory.ts";
import { loadReference } from "../src/references/load.ts";
import { validatePlan } from "../src/engine/validate.ts";
import { TechniqueSchema } from "../src/creative/contracts.ts";
import { editStoryboard } from "../src/server/editor.ts";
const original = loadBrief(path.join(ROOT, "briefs/demo-nafas/brief.json")).brief;
const adaptive = (changes = {}) => BriefSchema.parse({ ...original, creative: { mode: "adaptive", ...changes } });
const techniques = () => openReferenceMemory().listTechniques();

test("intake treats reference alone as knowledge and mixed request as target-product production", () => {
  assert.equal(creativeMode({ references: ["reference.mp4"] }).mode, "video-reference");
  assert.equal(creativeMode({ productBrief: "product.json", advertise: true }).mode, "product-production");
  assert.equal(creativeMode({ references: ["style.mp4"], productBrief: "target.json", advertise: true }).mode, "product-production");
  assert.throws(() => creativeMode({ references: ["reference.mp4"], advertise: true }));
  assert.throws(() => creativeMode({ productBrief: "product.json" }));
});
test("existing product briefs retain their exact storyboard and sound without adaptive input", () => {
  for (const name of ["demo-nafas", "demo-mint"]) {
    const b = loadBrief(path.join(ROOT, `briefs/${name}/brief.json`)).brief;
    assert.deepEqual(planProduction(b), buildStoryboard(b, ruleBasedDirector.draft(b)));
    assert.equal(planProduction(b).creativeDirection, undefined);
  }
});
test("technique selection ignores category labels, reference product names and reference assets", () => {
  const a = adaptive(), b = BriefSchema.parse({ ...a, product: { ...a.product, category: "Electronics" } });
  const one = planProduction(a), two = planProduction(b);
  assert.deepEqual(one.creativeDirection!.decisions, two.creativeDirection!.decisions);
  assert.ok(two.scenes.every(s => !s.image || b.product.images.includes(s.image)));
  assert.ok(!JSON.stringify(two).includes("Mirinda"));
  assert.deepEqual(two.brand.colors, b.brand.colors);
  assert.equal(two.creativeDirection!.primaryFeature, b.product.features[0]);
});
test("wide vs tall targets and restrained vs fast brands adapt sizes, easing, camera and transitions", () => {
  const wide = adaptive({ profile: { shape: "wide", dimensions: { width: 20, height: 8, unit: "cm" } } });
  const tall = BriefSchema.parse({ ...adaptive({ profile: { shape: "tall", assetAspect: 0.5 } }), tone: "luxury" });
  const a = planProduction(wide), b = planProduction(tall);
  assert.ok(a.engine!.layout.product.reveal < b.engine!.layout.product.reveal);
  assert.notDeepEqual(a.engine!.animation.kineticSpring, b.engine!.animation.kineticSpring);
  assert.notDeepEqual(a.scenes.find(s => s.kind === "reveal")!.camera, b.scenes.find(s => s.kind === "reveal")!.camera);
  const fast = planProduction(BriefSchema.parse({ ...wide, tone: "fast" }));
  assert.equal(fast.scenes[1]!.transition, "slide-up");
  assert.equal(b.scenes[1]!.transition, "fade");
  for (const [sb, brief] of [[a, wide], [b, tall]] as const) { validatePlan(sb, brief); assert.equal(sb.durationInFrames, sb.scenes.reduce((n, s) => n + s.durationInFrames, 0)); }
});
test("seven-dimensional ranking rejects true 3D, unmet physical conditions and untested observations", () => {
  const b = adaptive();
  const unavailable = TechniqueSchema.parse({ ...techniques()[0], id: "true-rotation", requires: ["true-3d", "physical-depth"] });
  const d = evaluateTechnique(b, unavailable);
  assert.equal(Object.keys(d.scores).length, 7);
  assert.equal(d.selected, false);
  assert.match(d.reasons.join(" "), /true-3d/);
  assert.ok(planProduction(b).creativeDirection!.decisions.filter(d => d.selected).every(d => techniques().find(t => t.id === d.techniqueId)!.status === "approved"));
  assert.equal(planProduction(b).creativeDirection!.profile.material, "unknown");
  assert.equal(planProduction(b).creativeDirection!.profile.dimensions, undefined);
});
test("custom lighting, unknown references and invalid physical inputs are rejected honestly", () => {
  assert.throws(() => planProduction(adaptive({ lightingStyle: "dramatic" })), /not implemented/);
  assert.throws(() => planProduction(adaptive({ referenceIds: ["reference-999"] })), /Unknown reference/);
  assert.equal(BriefSchema.safeParse({ ...original, creative: { mode: "adaptive", profile: { dimensions: { width: 0, height: 1, unit: "cm" } } } }).success, false);
});
test("compatible recipes compose deterministically with one owner per family and bounded cue clocks", () => {
  const b = adaptive({ audio: "quiet" });
  const duplicate = TechniqueSchema.parse({ ...techniques()[0], id: "camera-other" });
  const sb = adaptStoryboard(b, [...techniques(), duplicate]);
  assert.equal(sb.creativeDirection!.decisions.filter(d => d.selected && d.techniqueId.startsWith("camera")).length, 1);
  assert.deepEqual(sb.audio.sfx, []);
  assert.ok(sb.creativeDirection!.bindings.every(s => s.durationInFrames > 0 && s.lightingStyle === "template" && s.typography === "alexandria"));
  assert.deepEqual(adaptStoryboard(b, techniques()), adaptStoryboard(b, techniques()));
});
test("memory deduplicates canonical aliases and feedback cannot approve recipes or change defaults", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "ad-feedback-"));
  const file = path.join(ROOT, "references/creative-memory.json");
  try {
    fs.copyFileSync(file, path.join(folder, "creative-memory.json"));
    const before = JSON.parse(fs.readFileSync(file, "utf8"));
    const duplicate = structuredClone(before); duplicate.techniques[0].aliases = ["flavor-color-swap"];
    assert.equal(CreativeMemorySchema.safeParse(duplicate).success, false);
    recordCreativeFeedback({ id: "review-test", productionId: "product-test", techniqueIds: ["asymmetric-product-grid"], outcome: "unverified", succeeded: [], needsImprovement: ["Implementation required"], evidence: ["Storyboard review only"], tested: false }, folder);
    const after = JSON.parse(fs.readFileSync(path.join(folder, "creative-memory.json"), "utf8"));
    assert.deepEqual(after.techniques, before.techniques);
    assert.equal(after.feedback.length, before.feedback.length + 1);
    assert.deepEqual(after.feedback.slice(0, before.feedback.length), before.feedback);
    assert.throws(() => recordCreativeFeedback(after.feedback.at(-1), folder), /duplicate feedback/);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
test("analysis coverage has all 14 domains with unmeasured audio and commercial impact unknown", () => {
  const ref = loadReference(path.join(ROOT, "references/reference-003/ingestion.json"));
  const coverage = analysisCoverage(ref);
  assert.equal(coverage.length, 14);
  for (const domain of ["music-sync", "sound-design", "commercial-impact", "easing"]) assert.equal(coverage.find(d => d.domain === domain)!.status, "unverified");
});
test("editable adaptive storyboard preserves target ownership and refreshes binding durations", () => {
  const b = adaptive(), sb = planProduction(b), edited = structuredClone(sb);
  edited.scenes[1]!.durationInFrames += 15;
  const out = editStoryboard(b, sb, edited).storyboard;
  assert.equal(out.creativeDirection!.bindings[1]!.durationInFrames, out.scenes[1]!.durationInFrames);
});
test("low-contrast brand identity rejects automatic motion choices instead of hiding unreadable copy", () => {
  const b = BriefSchema.parse({ ...adaptive(), brand: { ...original.brand, colors: { ...original.brand.colors, text: original.brand.colors.background } } });
  assert.throws(() => planProduction(b), /No compatible approved motion/);
});
test("CLI/server planning reads owned SVG canvas proportions without inventing physical facts", () => {
  const b = adaptive(), dir = path.join(ROOT, "briefs/demo-nafas");
  const sb = planProduction(b, dir);
  assert.equal(sb.creativeDirection!.profile.assetAspect, 0.6);
  assert.equal(sb.creativeDirection!.profile.dimensions, undefined);
  assert.equal(sb.creativeDirection!.profile.material, "unknown");
  assert.equal(b.creative!.profile.assetAspect, undefined);
  assert.throws(() => planProduction(b, os.tmpdir()), /file not found/);
});
test("adding reference evidence never removes approved generic executors from another reference selection", () => {
  const b = adaptive({ referenceIds: ["reference-003"] });
  const sb = planProduction(b);
  assert.deepEqual(sb.creativeDirection!.decisions.filter(d => d.selected).map(d => d.techniqueId).sort(), ["camera-pan-zoom", "kinetic-typography", "smooth-transition"]);
  const four = planProduction(adaptive({ referenceIds: ["reference-004"] }));
  const picture = (s: typeof sb) => ({ scenes: s.scenes, engine: s.engine, audio: s.audio, brand: s.brand });
  assert.deepEqual(picture(sb), picture(four));
  assert.ok(four.creativeDirection!.decisions.filter(d => ["staggered-parts-assembly", "assembly-burst-reveal", "secondary-motion-hold"].includes(d.techniqueId)).every(d => !d.selected));
});
