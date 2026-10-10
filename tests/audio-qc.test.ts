import { test } from "node:test";
import assert from "node:assert/strict";
import { mixFilter } from "../src/audio/mix.ts";
import { musicBed, sfx } from "../src/audio/synth.ts";
import { peak, SR } from "../src/audio/wav.ts";
import { ruleBasedDirector } from "../src/creative/director.ts";
import { parseBrief } from "../src/intake/parseBrief.ts";
import { buildStoryboard } from "../src/storyboard/build.ts";
import { parseSpans } from "../src/qc/qc.ts";
import { contrast } from "../src/remotion/templates/bold-commercial/theme.ts";
import { caption } from "../src/delivery/package.ts";
import { demoBriefJson } from "./fixtures.ts";

const b = parseBrief({ ...demoBriefJson(), durationSec: 15 });
const sb = buildStoryboard(b, ruleBasedDirector.draft(b));

test("music bed is deterministic, the right length, and not silent", () => {
  const [l1] = musicBed(sb);
  const [l2] = musicBed(sb);
  assert.equal(l1.length, Math.round((sb.durationInFrames / sb.fps) * SR));
  assert.deepEqual(l1.subarray(0, 5000), l2.subarray(0, 5000));
  assert.ok(peak([l1]) > 0.1);
});

test("every SFX renders non-empty and finite", () => {
  for (const name of ["whoosh", "impact", "pop", "tick", "riser"] as const) {
    const s = sfx(name);
    assert.ok(s.length > 0 && s.every(Number.isFinite), name);
  }
});

test("mix graph ducks the bed under a voice-over only when there is one", () => {
  assert.doesNotMatch(mixFilter(10, false), /sidechaincompress/);
  assert.match(mixFilter(10, true), /sidechaincompress/);
  assert.match(mixFilter(10, true), /loudnorm=I=-14/);
});

test("QC span parser reads ffmpeg detector output", () => {
  const log = "[blackdetect @ 0x1] black_start:1.5 black_end:2.25 black_duration:0.75\n[silencedetect @ 0x2] silence_start: 3.1\n[silencedetect @ 0x2] silence_end: 4 | silence_duration: 0.9";
  assert.deepEqual(parseSpans(log, "black"), [[1.5, 2.25]]);
  assert.deepEqual(parseSpans(log, "silence"), [[3.1, 4]]);
});

test("contrast ratio matches WCAG reference values", () => {
  assert.equal(contrast("#000000", "#FFFFFF").toFixed(0), "21");
  assert.equal(contrast("#777777", "#777777"), 1);
});

test("caption uses only brief content and the client's hashtags", () => {
  const c = caption(b, sb);
  for (const f of b.product.features) assert.ok(c.includes(f));
  assert.ok(c.includes("#قهوة_باردة"));
});
