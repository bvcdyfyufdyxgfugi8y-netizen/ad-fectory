// Real PNG baselines plus repeatability checks from independently bundled compositions.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { ROOT } from "../core/exec.ts";
import { StoryboardSchema } from "../core/schema.ts";
import { validatePlan } from "../engine/validate.ts";
import { storyboardTimeline } from "../engine/timeline.ts";
import { templateDefinition } from "../engine/templates.ts";
import { loadReference } from "../references/load.ts";

const [storyboardFile, briefDir, outputDir, baselineFile] = process.argv.slice(2);
if (!storyboardFile || !briefDir || !outputDir) throw new Error("Usage: reference-snapshots.ts storyboard.json brief-dir output-dir [baseline-manifest.json]");
loadReference(path.join(ROOT, "references/reference-001/ingestion.json"));
const storyboard = StoryboardSchema.parse(JSON.parse(fs.readFileSync(storyboardFile, "utf8")));
validatePlan(storyboard);
assert.equal(storyboard.engine?.motionPreset?.name, "poster-stack-depth");
const rows = storyboardTimeline(storyboard);
const reveal = rows.find(row => row.scene.kind === "reveal")!;
const benefit = rows.find(row => row.scene.kind === "benefit")!;
const frames = [reveal.from + 6, reveal.from + 40, benefit.from + 40];
fs.mkdirSync(outputDir, { recursive: true });
const baseline = baselineFile ? JSON.parse(fs.readFileSync(baselineFile, "utf8")) as { frames: number[]; snapshots: Array<{ frame: number; sha256: string }> } : undefined;
if (baseline) assert.deepEqual(frames, baseline.frames, "baseline frame selection differs");
const snapshots: Array<{ frame: number; sha256: string; file: string }> = [];
for (let pass = 0; pass < 2; pass++) {
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/remotion/index.ts"), publicDir: path.resolve(briefDir) });
  const inputProps = { storyboard };
  const browserExecutable = process.env.REMOTION_BROWSER || undefined;
  const composition = await selectComposition({ serveUrl, id: templateDefinition(storyboard.template).compositionId, inputProps, browserExecutable });
  for (const frame of frames) {
    const filename = `frame-${frame}${pass ? "-repeat" : ""}.png`;
    const output = path.join(outputDir, filename);
    await renderStill({ serveUrl, composition, inputProps, frame, output, imageFormat: "png", browserExecutable });
    const sha256 = createHash("sha256").update(fs.readFileSync(output)).digest("hex");
    if (!pass) {
      if (baseline) assert.equal(sha256, baseline.snapshots.find(s => s.frame === frame)?.sha256, `golden PNG differs at frame ${frame}`);
      snapshots.push({ frame, sha256, file: filename });
    }
    else assert.equal(sha256, snapshots.find(s => s.frame === frame)!.sha256, `repeat PNG differs at frame ${frame}`);
  }
}
fs.writeFileSync(path.join(outputDir, "snapshots.json"), JSON.stringify({ status: "PASS", frames, passes: 2, freshBundles: 2, goldenCompared: Boolean(baseline), snapshots, scope: "Same-environment deterministic PNG regression baselines, not reference-video equivalence" }, null, 2));
console.log("Snapshot PASS: three native-resolution frames match across two fresh bundles");
