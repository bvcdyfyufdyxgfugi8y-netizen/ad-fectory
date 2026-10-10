import { test } from "node:test";
import assert from "node:assert/strict";
import { ruleBasedDirector, pickStrategy } from "../src/creative/director.ts";
import { parseBrief } from "../src/intake/parseBrief.ts";
import { allocateBeats, buildStoryboard, BPM, VIDEO } from "../src/storyboard/build.ts";
import { demoBriefJson } from "./fixtures.ts";

const brief = () => parseBrief(demoBriefJson());
const fpb = (VIDEO.fps * 60) / BPM;

test("storyboard length equals the requested duration and every cut is on the beat", () => {
  const lean = { ...demoBriefJson().product, features: ["بدون سكر مضاف"], price: undefined, oldPrice: undefined, currency: undefined };
  const cases = [
    { ...demoBriefJson(), durationSec: 15 }, { ...demoBriefJson(), durationSec: 20 }, { ...demoBriefJson(), durationSec: 30 },
    { ...demoBriefJson(), durationSec: 10, product: lean },
  ];
  for (const json of cases) {
    const b = parseBrief(json);
    const sec = b.durationSec;
    const sb = buildStoryboard(b, ruleBasedDirector.draft(b));
    assert.equal(sb.durationInFrames, sec * VIDEO.fps);
    assert.equal(sb.scenes.reduce((a, s) => a + s.durationInFrames, 0), sb.durationInFrames);
    for (const s of sb.scenes) assert.equal(s.durationInFrames % fpb, 0, `${s.id} not on beat grid`);
  }
});

test("1080x1920 at 30 fps, three distinct hooks", () => {
  const sb = buildStoryboard(brief(), ruleBasedDirector.draft(brief()));
  assert.deepEqual([sb.width, sb.height, sb.fps], [1080, 1920, 30]);
  assert.equal(new Set(sb.hooks).size, 3);
});

test("no invented claims: every scene traces to brief fields, and feature text is verbatim", () => {
  const b = brief();
  const sb = buildStoryboard(b, ruleBasedDirector.draft(b));
  for (const s of sb.scenes) {
    assert.ok(s.source.length > 0, `${s.id} has no source`);
    if (s.kind === "benefit") assert.ok(b.product.features.includes(s.headline), `${s.headline} is not a stated feature`);
  }
  // no offer scene unless the brief has a price or offer
  const noPrice = parseBrief({ ...demoBriefJson(), product: { ...demoBriefJson().product, price: undefined, oldPrice: undefined, currency: undefined } });
  assert.ok(!buildStoryboard(noPrice, ruleBasedDirector.draft(noPrice)).scenes.some((s) => s.kind === "offer"));
});

test("strategy follows the brief", () => {
  assert.equal(pickStrategy(brief()), "product-reveal");
  assert.equal(pickStrategy(parseBrief({ ...demoBriefJson(), product: { ...demoBriefJson().product, problem: "القهوة الحارة ما تناسب الصيف" } })), "problem-solution");
  assert.equal(pickStrategy(parseBrief({ ...demoBriefJson(), goal: "sell", product: { ...demoBriefJson().product, offer: "خصم 20%" } })), "offer-first");
});

test("allocateBeats respects floors and sums exactly", () => {
  const out = allocateBeats([1, 2, 3], [2, 2, 2], 17);
  assert.equal(out.reduce((a, b) => a + b, 0), 17);
  out.forEach((v) => assert.ok(v >= 2));
  assert.throws(() => allocateBeats([1, 1], [5, 5], 8), /shorten copy/);
});

test("SFX cues sit inside the ad", () => {
  const sb = buildStoryboard(brief(), ruleBasedDirector.draft(brief()));
  for (const c of sb.audio.sfx) assert.ok(c.frame >= 0 && c.frame < sb.durationInFrames);
});

test("a short ad drops later benefits to keep text readable, and refuses when even that cannot fit", () => {
  const b15 = parseBrief({ ...demoBriefJson(), durationSec: 15 });
  const n15 = buildStoryboard(b15, ruleBasedDirector.draft(b15)).scenes.filter((s) => s.kind === "benefit").length;
  const n30 = buildStoryboard(brief(), ruleBasedDirector.draft(brief())).scenes.filter((s) => s.kind === "benefit").length;
  assert.ok(n15 >= 1 && n15 <= n30);
  const b10 = parseBrief({ ...demoBriefJson(), durationSec: 10 });
  assert.throws(() => buildStoryboard(b10, ruleBasedDirector.draft(b10)), /shorten copy or lengthen the ad/);
});
