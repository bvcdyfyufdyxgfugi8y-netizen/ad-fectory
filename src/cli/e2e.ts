// End-to-end acceptance test for Phase 1 (real renders, takes a few minutes):
//  1. produce the demo ad from its brief → QC must pass
//  2. run again unchanged → picture and audio both come from cache (no wasted re-render)
//  3. edit one line in the storyboard (the CTA) and re-export → picture re-renders, audio is reused, QC passes
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../core/exec.ts";
import { StoryboardSchema } from "../core/schema.ts";
import { produce } from "./produce.ts";

const brief = path.join(ROOT, "briefs/demo-nafas/brief.json");

const first = await produce(brief);
assert.ok(first.qcPassed, "QC failed on the first render");

const again = await produce(brief);
assert.deepEqual(again.cached, { audio: true, video: true }, "unchanged brief should be fully cached");
assert.ok(again.qcPassed);

const sb = StoryboardSchema.parse(JSON.parse(fs.readFileSync(path.join(first.outDir, "storyboard.json"), "utf8")));
const cta = sb.scenes.find((s) => s.kind === "cta")!;
cta.headline = sb.language === "ar" ? "جرّبها اليوم" : "Try it today";
const edited = path.join(first.outDir, "storyboard.edited.json");
fs.writeFileSync(edited, JSON.stringify(sb, null, 2));
const re = await produce(brief, { storyboardFile: edited });
assert.deepEqual(re.cached, { audio: true, video: false }, "a text edit must re-render the picture only");
assert.ok(re.qcPassed, "QC failed after the edit");

// restore the canonical output so delivery/ matches the brief again
await produce(brief);
console.log(`\nE2E PASS · first render ${first.timings.total}s · cached re-run ${again.timings.total}s · text-edit re-export ${re.timings.total}s`);
